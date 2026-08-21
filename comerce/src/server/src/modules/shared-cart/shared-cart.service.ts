import prisma from "@/infra/database/database.config";
import redisClient from "@/infra/cache/redis";
import AppError from "@/shared/errors/AppError";
import {
  CART_STATUS,
  SHARED_CART_ACTIVITY_TYPE,
  SHARED_CART_ASSIGNMENT_STATUS,
  SHARED_CART_INVITE_MODE,
  SHARED_CART_MEMBER_ROLE,
  SHARED_CART_VOTE_TYPE,
} from "@prisma/client";
import { Server as SocketIOServer } from "socket.io";
import { CheckoutService } from "../checkout/checkout.service";

type Actor = {
  userId?: string;
  sessionId?: string;
  displayName?: string;
};

type SharedCartSettingsInput = {
  title?: string;
  expiresAt?: string | null;
  inviteMode?: SHARED_CART_INVITE_MODE;
  isReadOnly?: boolean;
};

type SharedCartCheckoutState = {
  status: "IDLE" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: string | null;
  startedByName?: string | null;
  startedByUserId?: string | null;
  completedAt?: string | null;
};

export class SharedCartService {
  constructor(private io?: SocketIOServer) {}

  private buildMemberToken(actor: Actor) {
    if (actor.userId) {
      return `user:${actor.userId}`;
    }

    if (actor.sessionId) {
      return `session:${actor.sessionId}`;
    }

    throw new AppError(400, "A shared cart session could not be identified");
  }

  private async buildDisplayName(actor: Actor) {
    if (actor.displayName?.trim()) {
      return actor.displayName.trim();
    }

    if (actor.userId) {
      const user = await prisma.user.findUnique({
        where: { id: actor.userId },
        select: { name: true },
      });

      if (user?.name) {
        return user.name;
      }
    }

    return "Guest collaborator";
  }

  private generateCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  private async generateUniqueCode() {
    let code = this.generateCode();

    while (await prisma.sharedCart.findUnique({ where: { code } })) {
      code = this.generateCode();
    }

    return code;
  }

  private getCheckoutStateKey(code: string) {
    return `shared-cart:checkout:${code}`;
  }

  private async getCheckoutState(code: string): Promise<SharedCartCheckoutState> {
    const raw = await redisClient.get(this.getCheckoutStateKey(code));

    if (!raw) {
      return {
        status: "IDLE",
      };
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        status: parsed?.status || "IDLE",
        startedAt: parsed?.startedAt || null,
        startedByName: parsed?.startedByName || null,
        startedByUserId: parsed?.startedByUserId || null,
        completedAt: parsed?.completedAt || null,
      };
    } catch {
      return {
        status: "IDLE",
      };
    }
  }

  private async setCheckoutState(
    code: string,
    state: SharedCartCheckoutState,
    ttlSeconds = 60 * 60 * 2
  ) {
    await redisClient.set(
      this.getCheckoutStateKey(code),
      JSON.stringify(state),
      "EX",
      ttlSeconds
    );
  }

  private async clearCheckoutState(code: string) {
    await redisClient.del(this.getCheckoutStateKey(code));
  }

  private buildSummary(sharedCart: any, checkoutState: SharedCartCheckoutState) {
    const items = sharedCart?.cart?.cartItems || [];
    const assignments = sharedCart?.assignments || [];
    const votes = sharedCart?.votes || [];
    const goalBudget = Number(sharedCart?.goalBundle?.budget || 0);
    const inviteExpired = sharedCart.expiresAt
      ? new Date(sharedCart.expiresAt).getTime() < Date.now()
      : false;
    const isCheckoutLocked = checkoutState.status === "IN_PROGRESS";

    const voteSummary = votes.reduce(
      (acc: Record<string, { upvotes: number; downvotes: number }>, vote: any) => {
        if (!acc[vote.variantId]) {
          acc[vote.variantId] = { upvotes: 0, downvotes: 0 };
        }

        if (vote.vote === SHARED_CART_VOTE_TYPE.UPVOTE) {
          acc[vote.variantId].upvotes += 1;
        } else {
          acc[vote.variantId].downvotes += 1;
        }

        return acc;
      },
      {}
    );

    const memberSubtotals = assignments.reduce(
      (acc: Record<string, number>, assignment: any) => {
        const item = items.find((cartItem: any) => cartItem.variantId === assignment.variantId);
        if (!item) {
          return acc;
        }

        if (assignment.status === SHARED_CART_ASSIGNMENT_STATUS.RELEASED) {
          return acc;
        }

        acc[assignment.assigneeName] =
          (acc[assignment.assigneeName] || 0) +
          assignment.quantity * Number(item.variant.price || 0);
        return acc;
      },
      {}
    );

    const unresolvedItems = items.filter((item: any) => {
      const assignedQuantity = assignments
        .filter(
          (assignment: any) =>
            assignment.variantId === item.variantId &&
            assignment.status !== SHARED_CART_ASSIGNMENT_STATUS.RELEASED
        )
        .reduce((sum: number, assignment: any) => sum + assignment.quantity, 0);
      return assignedQuantity < item.quantity;
    }).length;

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.quantity * Number(item.variant.price || 0),
      0
    );

    const shortlist = items
      .map((item: any) => ({
        variantId: item.variantId,
        productName: item.variant?.product?.name || "Item",
        sku: item.variant?.sku || "",
        netVotes:
          (voteSummary[item.variantId]?.upvotes || 0) -
          (voteSummary[item.variantId]?.downvotes || 0),
      }))
      .filter((entry: any) => entry.netVotes > 0)
      .sort((a: any, b: any) => b.netVotes - a.netVotes)
      .slice(0, 3);

    const assignedItems = items
      .map((item: any) => {
        const itemAssignments = assignments.filter(
          (assignment: any) =>
            assignment.variantId === item.variantId &&
            assignment.status !== SHARED_CART_ASSIGNMENT_STATUS.RELEASED
        );

        return {
          variantId: item.variantId,
          assignedQuantity: itemAssignments.reduce(
            (sum: number, assignment: any) => sum + assignment.quantity,
            0
          ),
          requiredQuantity: item.quantity,
        };
      })
      .filter((entry: any) => entry.assignedQuantity > 0);

    const pollWinner = shortlist[0] || null;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalLines: items.length,
      totalUnits: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      unresolvedItems,
      readyToBuy: items.length > 0 && unresolvedItems === 0,
      canProceedToCheckout:
        items.length > 0 &&
        unresolvedItems === 0 &&
        !inviteExpired &&
        checkoutState.status !== "IN_PROGRESS" &&
        checkoutState.status !== "COMPLETED",
      assignedItems,
      invite: {
        isReadOnly: sharedCart.isReadOnly,
        inviteMode: sharedCart.inviteMode,
        expiresAt: sharedCart.expiresAt,
        isExpired: inviteExpired,
      },
      checkout: {
        status: checkoutState.status,
        isLocked: isCheckoutLocked,
        startedAt: checkoutState.startedAt || null,
        startedByName: checkoutState.startedByName || null,
        completedAt: checkoutState.completedAt || null,
      },
      budget: goalBudget
        ? {
            target: Number(goalBudget.toFixed(2)),
            remaining: Number(Math.max(goalBudget - subtotal, 0).toFixed(2)),
            overBy: Number(Math.max(subtotal - goalBudget, 0).toFixed(2)),
            utilization: Number(Math.min((subtotal / goalBudget) * 100, 999).toFixed(2)),
          }
        : null,
      memberSubtotals: Object.entries(memberSubtotals).map(([assigneeName, total]) => ({
        assigneeName,
        total: Number((total as number).toFixed(2)),
      })),
      shortlist,
      pollWinner,
      voteSummary,
    };
  }

  private async formatSharedCart(sharedCart: any) {
    const checkoutState = await this.getCheckoutState(sharedCart.code);
    const roomMessages = (sharedCart?.notes || []).filter(
      (note: any) => !note.variantId
    );
    const itemNotes = (sharedCart?.notes || []).filter((note: any) =>
      Boolean(note.variantId)
    );

    return {
      ...sharedCart,
      messages: roomMessages,
      itemNotes,
      summary: this.buildSummary(sharedCart, checkoutState),
    };
  }

  private assertInviteIsActive(sharedCart: any) {
    if (sharedCart.expiresAt && new Date(sharedCart.expiresAt).getTime() < Date.now()) {
      throw new AppError(410, "This shared cart invite has expired");
    }
  }

  private async createActivity(
    sharedCartId: string,
    actor: Actor,
    type: SHARED_CART_ACTIVITY_TYPE,
    message: string,
    payload?: Record<string, unknown>
  ) {
    const memberToken = actor.userId || actor.sessionId ? this.buildMemberToken(actor) : undefined;
    const actorName = await this.buildDisplayName(actor);

    await prisma.sharedCartActivity.create({
      data: {
        sharedCartId,
        memberToken,
        actorName,
        type,
        message,
        payload,
      },
    });
  }

  private async getSharedCartByCodeOrThrow(code: string) {
    const sharedCart = await prisma.sharedCart.findUnique({
      where: { code },
      include: {
        goalBundle: {
          include: {
            goalTemplate: {
              include: {
                steps: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        cart: {
          include: {
            cartItems: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
        members: {
          orderBy: { updatedAt: "desc" },
        },
        votes: {
          orderBy: { updatedAt: "desc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
        },
        assignments: {
          orderBy: { updatedAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
    });

    if (!sharedCart) {
      throw new AppError(404, "Shared cart not found");
    }

    return sharedCart;
  }

  private async emitSnapshot(code: string) {
    const sharedCart = await this.formatSharedCart(
      await this.getSharedCartByCodeOrThrow(code)
    );
    this.io?.to(`shared-cart:${code}`).emit("sharedCartUpdated", { sharedCart });
    return sharedCart;
  }

  private async resolveMembership(
    code: string,
    actor: Actor,
    options?: {
      allowedRoles?: SHARED_CART_MEMBER_ROLE[];
      requireWritable?: boolean;
    }
  ) {
    const sharedCart = await prisma.sharedCart.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        ownerId: true,
        cartId: true,
        inviteMode: true,
        isReadOnly: true,
        expiresAt: true,
      },
    });

    if (!sharedCart) {
      throw new AppError(404, "Shared cart not found");
    }

    this.assertInviteIsActive(sharedCart);

    const token = this.buildMemberToken(actor);
    let member = await prisma.sharedCartMember.findUnique({
      where: {
        sharedCartId_token: {
          sharedCartId: sharedCart.id,
          token,
        },
      },
    });

    if (!member) {
      await this.joinSharedCart(code, actor);
      member = await prisma.sharedCartMember.findUnique({
        where: {
          sharedCartId_token: {
            sharedCartId: sharedCart.id,
            token,
          },
        },
      });
    }

    if (!member) {
      throw new AppError(403, "Could not join the shared cart");
    }

    if (options?.allowedRoles && !options.allowedRoles.includes(member.role)) {
      throw new AppError(403, "You do not have permission to do that in this shared cart");
    }

    if (options?.requireWritable) {
      const checkoutState = await this.getCheckoutState(code);

      if (checkoutState.status === "IN_PROGRESS") {
        throw new AppError(
          403,
          `Checkout is already in progress${checkoutState.startedByName ? ` by ${checkoutState.startedByName}` : ""}.`
        );
      }

      if (checkoutState.status === "COMPLETED") {
        throw new AppError(403, "This shared cart has already completed checkout");
      }

      if (sharedCart.isReadOnly || member.role === SHARED_CART_MEMBER_ROLE.VIEWER) {
        throw new AppError(403, "This shared cart is read only right now");
      }
    }

    return {
      sharedCart,
      member,
      token,
      actorName: await this.buildDisplayName(actor),
    };
  }

  async createSharedCart(
    userId: string,
    title?: string,
    options?: {
      cartId?: string;
      goalBundleId?: string;
      inviteMode?: SHARED_CART_INVITE_MODE;
      isReadOnly?: boolean;
      expiresAt?: string | null;
    }
  ) {
    let cart =
      options?.cartId
        ? await prisma.cart.findUnique({
            where: { id: options.cartId },
            include: {
              cartItems: {
                include: {
                  variant: {
                    include: { product: true },
                  },
                },
              },
            },
          })
        : await prisma.cart.findFirst({
            where: {
              userId,
              status: CART_STATUS.ACTIVE,
            },
            orderBy: { updatedAt: "desc" },
            include: {
              cartItems: {
                include: {
                  variant: {
                    include: { product: true },
                  },
                },
              },
            },
          });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          goalBundleId: options?.goalBundleId,
        },
        include: {
          cartItems: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });
    }

    const existing = await prisma.sharedCart.findUnique({
      where: { cartId: cart.id },
    });

    if (existing) {
      await prisma.sharedCart.update({
        where: { id: existing.id },
        data: {
          title: title || existing.title,
          goalBundleId: options?.goalBundleId ?? existing.goalBundleId,
          inviteMode: options?.inviteMode ?? existing.inviteMode,
          isReadOnly:
            options?.isReadOnly !== undefined ? options.isReadOnly : existing.isReadOnly,
          expiresAt:
            options?.expiresAt !== undefined
              ? options.expiresAt
                ? new Date(options.expiresAt)
                : null
              : existing.expiresAt,
        },
      });

      await prisma.sharedCartMember.upsert({
        where: {
          sharedCartId_token: {
            sharedCartId: existing.id,
            token: `user:${userId}`,
          },
        },
        create: {
          sharedCartId: existing.id,
          userId,
          token: `user:${userId}`,
          displayName: "Owner",
          role: SHARED_CART_MEMBER_ROLE.OWNER,
        },
        update: {
          lastSeenAt: new Date(),
          role: SHARED_CART_MEMBER_ROLE.OWNER,
        },
      });

      return this.emitSnapshot(existing.code);
    }

    const code = await this.generateUniqueCode();
    const sharedCart = await prisma.sharedCart.create({
      data: {
        code,
        cartId: cart.id,
        goalBundleId: options?.goalBundleId,
        ownerId: userId,
        title,
        inviteMode: options?.inviteMode || SHARED_CART_INVITE_MODE.COLLABORATE,
        isReadOnly: options?.isReadOnly || false,
        expiresAt: options?.expiresAt ? new Date(options.expiresAt) : null,
        members: {
          create: {
            userId,
            token: `user:${userId}`,
            displayName: "Owner",
            role: SHARED_CART_MEMBER_ROLE.OWNER,
          },
        },
      },
    });

    await this.createActivity(
      sharedCart.id,
      { userId, displayName: "Owner" },
      SHARED_CART_ACTIVITY_TYPE.MEMBER_JOINED,
      "Shared cart created"
    );

    return this.emitSnapshot(sharedCart.code);
  }

  async createSharedCartFromGoalBundle(userId: string, bundleId: string, title?: string) {
    const bundle = await prisma.goalBundle.findUnique({
      where: { id: bundleId },
      include: {
        items: true,
        goalTemplate: true,
      },
    });

    if (!bundle || bundle.userId !== userId) {
      throw new AppError(404, "Goal bundle not found");
    }

    const cart = await prisma.cart.create({
      data: {
        userId,
        goalTemplateId: bundle.goalTemplateId,
        goalBundleId: bundle.id,
        cartItems: {
          create: bundle.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity || 1,
          })),
        },
      },
    });

    return this.createSharedCart(
      userId,
      title || bundle.name || bundle.goalTemplate?.title || "Shared bundle",
      {
        cartId: cart.id,
        goalBundleId: bundle.id,
      }
    );
  }

  async getSharedCart(code: string) {
    return this.formatSharedCart(await this.getSharedCartByCodeOrThrow(code));
  }

  async joinSharedCart(code: string, actor: Actor) {
    const sharedCart = await prisma.sharedCart.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        ownerId: true,
        inviteMode: true,
        isReadOnly: true,
        expiresAt: true,
      },
    });

    if (!sharedCart) {
      throw new AppError(404, "Shared cart not found");
    }

    this.assertInviteIsActive(sharedCart);

    const token = this.buildMemberToken(actor);
    const displayName = await this.buildDisplayName(actor);
    const role =
      actor.userId && actor.userId === sharedCart.ownerId
        ? SHARED_CART_MEMBER_ROLE.OWNER
        : sharedCart.isReadOnly || sharedCart.inviteMode === SHARED_CART_INVITE_MODE.VIEW_ONLY
          ? SHARED_CART_MEMBER_ROLE.VIEWER
          : SHARED_CART_MEMBER_ROLE.CONTRIBUTOR;

    const existing = await prisma.sharedCartMember.findUnique({
      where: {
        sharedCartId_token: {
          sharedCartId: sharedCart.id,
          token,
        },
      },
    });

    await prisma.sharedCartMember.upsert({
      where: {
        sharedCartId_token: {
          sharedCartId: sharedCart.id,
          token,
        },
      },
      create: {
        sharedCartId: sharedCart.id,
        userId: actor.userId,
        sessionId: actor.sessionId,
        token,
        displayName,
        role,
      },
      update: {
        userId: actor.userId,
        sessionId: actor.sessionId,
        displayName,
        role,
        lastSeenAt: new Date(),
      },
    });

    if (!existing) {
      await this.createActivity(
        sharedCart.id,
        actor,
        SHARED_CART_ACTIVITY_TYPE.MEMBER_JOINED,
        `${displayName} joined the shared cart`
      );
    }

    const snapshot = await this.emitSnapshot(code);
    this.io?.to(`shared-cart:${code}`).emit("sharedCartPresenceUpdated", {
      members: snapshot.members,
    });

    return snapshot;
  }

  async updateSharedCartItem(
    code: string,
    actor: Actor,
    variantId: string,
    quantity: number
  ) {
    if (!variantId) {
      throw new AppError(400, "Variant ID is required");
    }

    const { sharedCart, actorName } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER, SHARED_CART_MEMBER_ROLE.CONTRIBUTOR],
      requireWritable: true,
    });

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    if (!variant) {
      throw new AppError(404, "Product variant not found");
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: sharedCart.cartId,
        variantId,
      },
    });

    if (quantity <= 0) {
      if (existingItem) {
        await prisma.cartItem.delete({ where: { id: existingItem.id } });
        await prisma.sharedCartAssignment.deleteMany({
          where: {
            sharedCartId: sharedCart.id,
            variantId,
          },
        });
      }
    } else if (variant.stock < quantity) {
      throw new AppError(
        400,
        `Insufficient stock for this item. Only ${variant.stock} left.`
      );
    } else if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: sharedCart.cartId,
          variantId,
          quantity,
        },
      });
    }

    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.ITEM_UPDATED,
      `${actorName} updated an item quantity`,
      { variantId, quantity }
    );

    return this.emitSnapshot(code);
  }

  async removeSharedCartItem(code: string, actor: Actor, itemId: string) {
    const { sharedCart, actorName } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER, SHARED_CART_MEMBER_ROLE.CONTRIBUTOR],
      requireWritable: true,
    });

    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });

    if (!item || item.cartId !== sharedCart.cartId) {
      throw new AppError(404, "Shared cart item not found");
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    await prisma.sharedCartAssignment.deleteMany({
      where: {
        sharedCartId: sharedCart.id,
        variantId: item.variantId,
      },
    });

    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.ITEM_REMOVED,
      `${actorName} removed an item`,
      { itemId, variantId: item.variantId }
    );

    return this.emitSnapshot(code);
  }

  async voteOnItem(
    code: string,
    actor: Actor,
    variantId: string,
    vote: SHARED_CART_VOTE_TYPE
  ) {
    const { sharedCart, token, actorName } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER, SHARED_CART_MEMBER_ROLE.CONTRIBUTOR],
      requireWritable: true,
    });

    await prisma.sharedCartVote.upsert({
      where: {
        sharedCartId_variantId_memberToken: {
          sharedCartId: sharedCart.id,
          variantId,
          memberToken: token,
        },
      },
      create: {
        sharedCartId: sharedCart.id,
        variantId,
        memberToken: token,
        displayName: actorName,
        vote,
      },
      update: {
        displayName: actorName,
        vote,
      },
    });

    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.VOTE_ADDED,
      `${actorName} voted on an item`,
      { variantId, vote }
    );

    const snapshot = await this.emitSnapshot(code);
    this.io?.to(`shared-cart:${code}`).emit("sharedCartVoteUpdated", {
      votes: snapshot.votes,
    });

    return snapshot;
  }

  async addNote(code: string, actor: Actor, content: string, variantId?: string) {
    if (!content?.trim()) {
      throw new AppError(400, "Note content is required");
    }

    const { sharedCart, token, actorName } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER, SHARED_CART_MEMBER_ROLE.CONTRIBUTOR],
      requireWritable: true,
    });

    await prisma.sharedCartNote.create({
      data: {
        sharedCartId: sharedCart.id,
        variantId,
        memberToken: token,
        authorName: actorName,
        content: content.trim(),
      },
    });

    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.NOTE_ADDED,
      `${actorName} added a note`,
      { variantId, content: content.trim() }
    );

    const snapshot = await this.emitSnapshot(code);
    this.io?.to(`shared-cart:${code}`).emit("sharedCartNoteAdded", {
      notes: snapshot.notes,
    });

    return snapshot;
  }

  async sendMessage(code: string, actor: Actor, content: string, variantId?: string) {
    if (!content?.trim()) {
      throw new AppError(400, "Message content is required");
    }

    const { sharedCart, token, actorName } = await this.resolveMembership(code, actor, {
      allowedRoles: [
        SHARED_CART_MEMBER_ROLE.OWNER,
        SHARED_CART_MEMBER_ROLE.CONTRIBUTOR,
        SHARED_CART_MEMBER_ROLE.VIEWER,
      ],
    });

    await prisma.sharedCartNote.create({
      data: {
        sharedCartId: sharedCart.id,
        variantId,
        memberToken: token,
        authorName: actorName,
        content: content.trim(),
      },
    });

    const snapshot = await this.emitSnapshot(code);
    this.io?.to(`shared-cart:${code}`).emit("sharedCartNoteAdded", {
      notes: snapshot.notes,
      messages: snapshot.messages,
    });

    return snapshot;
  }

  async assignItem(
    code: string,
    actor: Actor,
    payload: {
      variantId: string;
      quantity?: number;
      status?: SHARED_CART_ASSIGNMENT_STATUS;
    }
  ) {
    const { sharedCart, token, actorName } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER, SHARED_CART_MEMBER_ROLE.CONTRIBUTOR],
      requireWritable: true,
    });

    const quantity = payload.quantity && payload.quantity > 0 ? payload.quantity : 1;
    const status = payload.status || SHARED_CART_ASSIGNMENT_STATUS.CLAIMED;

    if (!payload.variantId) {
      throw new AppError(400, "Variant ID is required");
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: sharedCart.cartId,
        variantId: payload.variantId,
      },
    });

    if (!cartItem) {
      throw new AppError(404, "That item is not in the shared cart");
    }

    if (status === SHARED_CART_ASSIGNMENT_STATUS.RELEASED) {
      await prisma.sharedCartAssignment.deleteMany({
        where: {
          sharedCartId: sharedCart.id,
          variantId: payload.variantId,
          memberToken: token,
        },
      });
    } else {
      await prisma.sharedCartAssignment.upsert({
        where: {
          sharedCartId_variantId_memberToken: {
            sharedCartId: sharedCart.id,
            variantId: payload.variantId,
            memberToken: token,
          },
        },
        create: {
          sharedCartId: sharedCart.id,
          variantId: payload.variantId,
          memberToken: token,
          assigneeName: actorName,
          quantity,
          status,
        },
        update: {
          assigneeName: actorName,
          quantity,
          status,
        },
      });
    }

    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.ASSIGNMENT_UPDATED,
      `${actorName} updated ownership for an item`,
      { variantId: payload.variantId, quantity, status }
    );

    return this.emitSnapshot(code);
  }

  async initiateCheckout(code: string, actor: Actor) {
    if (!actor.userId) {
      throw new AppError(401, "Sign in to start checkout from a shared cart");
    }

    const { sharedCart, actorName } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER],
    });
    const currentCheckoutState = await this.getCheckoutState(code);

    if (currentCheckoutState.status === "IN_PROGRESS") {
      throw new AppError(
        409,
        `Checkout is already in progress${currentCheckoutState.startedByName ? ` by ${currentCheckoutState.startedByName}` : ""}.`
      );
    }

    if (currentCheckoutState.status === "COMPLETED") {
      throw new AppError(409, "This shared cart has already completed checkout");
    }

    const hydratedSharedCart = await this.getSharedCartByCodeOrThrow(code);
    const formattedSharedCart = await this.formatSharedCart(hydratedSharedCart);

    if (!formattedSharedCart.summary.readyToBuy) {
      throw new AppError(
        400,
        "This shared cart still has unresolved items before checkout can begin"
      );
    }

    if (!hydratedSharedCart.cart || hydratedSharedCart.cart.userId !== actor.userId) {
      throw new AppError(
        403,
        "Only the shared cart owner can complete checkout from this room"
      );
    }

    await this.setCheckoutState(code, {
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
      startedByName: actorName,
      startedByUserId: actor.userId,
    });

    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.SETTINGS_UPDATED,
      `${actorName} started checkout for the shared cart`,
      {
        kind: "checkout",
        status: "IN_PROGRESS",
      }
    );

    await this.emitSnapshot(code);

    try {
      const checkoutService = new CheckoutService(this.io);
      const session = await checkoutService.createStripeSession(
        {
          ...hydratedSharedCart.cart,
          sharedCart: {
            code: hydratedSharedCart.code,
            title: hydratedSharedCart.title,
          },
        },
        actor.userId,
        "shared-cart"
      );

      return {
        session,
        sharedCart: await this.emitSnapshot(code),
      };
    } catch (error) {
      await this.clearCheckoutState(code);
      await this.createActivity(
        sharedCart.id,
        actor,
        SHARED_CART_ACTIVITY_TYPE.SETTINGS_UPDATED,
        `${actorName} could not start shared checkout`,
        {
          kind: "checkout",
          status: "IDLE",
        }
      );
      await this.emitSnapshot(code);
      throw error;
    }
  }

  async releaseCheckout(code: string, actor: Actor) {
    const { sharedCart, actorName } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER],
    });

    await this.clearCheckoutState(code);
    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.SETTINGS_UPDATED,
      `${actorName} released the shared checkout lock`,
      {
        kind: "checkout",
        status: "IDLE",
      }
    );

    return this.emitSnapshot(code);
  }

  async updateSettings(code: string, actor: Actor, settings: SharedCartSettingsInput) {
    const { sharedCart } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER],
    });

    const expiresAt =
      settings.expiresAt === undefined
        ? undefined
        : settings.expiresAt
          ? new Date(settings.expiresAt)
          : null;

    if (expiresAt && expiresAt.getTime() < Date.now()) {
      throw new AppError(400, "Expiry must be in the future");
    }

    await prisma.sharedCart.update({
      where: { id: sharedCart.id },
      data: {
        title: settings.title ?? undefined,
        inviteMode: settings.inviteMode ?? undefined,
        isReadOnly: settings.isReadOnly ?? undefined,
        expiresAt,
      },
    });

    if (
      settings.isReadOnly === true ||
      settings.inviteMode === SHARED_CART_INVITE_MODE.VIEW_ONLY
    ) {
      await prisma.sharedCartMember.updateMany({
        where: {
          sharedCartId: sharedCart.id,
          role: {
            not: SHARED_CART_MEMBER_ROLE.OWNER,
          },
        },
        data: {
          role: SHARED_CART_MEMBER_ROLE.VIEWER,
        },
      });
    }

    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.SETTINGS_UPDATED,
      "Updated shared cart settings",
      settings as Record<string, unknown>
    );

    return this.emitSnapshot(code);
  }

  async regenerateInvite(code: string, actor: Actor) {
    const { sharedCart } = await this.resolveMembership(code, actor, {
      allowedRoles: [SHARED_CART_MEMBER_ROLE.OWNER],
    });

    const nextCode = await this.generateUniqueCode();
    await prisma.sharedCart.update({
      where: { id: sharedCart.id },
      data: {
        code: nextCode,
      },
    });

    await this.createActivity(
      sharedCart.id,
      actor,
      SHARED_CART_ACTIVITY_TYPE.INVITE_REGENERATED,
      "Regenerated the shared cart invite link",
      { previousCode: code, nextCode }
    );

    return this.getSharedCart(nextCode);
  }
}
