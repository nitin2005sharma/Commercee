import getStripe from "@/infra/payment/stripe";
import prisma from "@/infra/database/database.config";
import redisClient from "@/infra/cache/redis";
import AppError from "@/shared/errors/AppError";
import {
  CART_STATUS,
  CHECKOUT_ATTEMPT_STATUS,
  CHECKOUT_RECOVERY_STATUS,
  PAYMENT_STATUS,
  TRANSACTION_STATUS,
} from "@prisma/client";
import { Server as SocketIOServer } from "socket.io";
import { buildOrderTrackingEventData } from "../order/orderTracking.helpers";

const stripe = getStripe();
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150";

function safeImage(images: string[] = []) {
  return images?.[0] || PLACEHOLDER_IMAGE;
}

function validImage(url: string) {
  return url.length <= 2048 ? url : PLACEHOLDER_IMAGE;
}

export class CheckoutService {
  constructor(private io?: SocketIOServer) {}

  private getSharedCartCheckoutKey(code: string) {
    return `shared-cart:checkout:${code}`;
  }

  private async setSharedCartCheckoutState(
    code: string,
    state: {
      status: "IN_PROGRESS" | "COMPLETED";
      startedAt?: string | null;
      startedByName?: string | null;
      startedByUserId?: string | null;
      completedAt?: string | null;
    },
    ttlSeconds = 60 * 60 * 24
  ) {
    await redisClient.set(
      this.getSharedCartCheckoutKey(code),
      JSON.stringify(state),
      "EX",
      ttlSeconds
    );
  }

  private async clearSharedCartCheckoutState(code?: string | null) {
    if (!code) {
      return;
    }

    await redisClient.del(this.getSharedCartCheckoutKey(code));
  }

  private emitSharedCartCheckoutUpdate(code?: string | null) {
    if (!code) {
      return;
    }

    this.io?.to(`shared-cart:${code}`).emit("sharedCartCheckoutUpdated", {
      code,
    });
  }

  private getClientUrl() {
    const isProduction = process.env.NODE_ENV === "production";

    return (
      (isProduction
        ? process.env.CLIENT_URL_PROD
        : process.env.CLIENT_URL_DEV) || "http://localhost:3000"
    );
  }

  private calculateAmount(cart: any) {
    return cart.cartItems.reduce(
      (sum: number, item: any) => sum + item.quantity * item.variant.price,
      0
    );
  }

  private buildCartSnapshot(cart: any) {
    const items = cart.cartItems.map((item: any) => ({
      cartItemId: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      sku: item.variant.sku,
      price: item.variant.price,
      productName: item.variant.product.name,
      image: item.variant.images?.[0] || null,
    }));

    return {
      cartId: cart.id,
      goalTemplateId: cart.goalTemplateId || null,
      goalBundleId: cart.goalBundleId || null,
      sharedCartCode: cart.sharedCart?.code || null,
      sharedCartTitle: cart.sharedCart?.title || null,
      subtotal: Number(this.calculateAmount(cart).toFixed(2)),
      itemCount: items.reduce(
        (count: number, item: any) => count + item.quantity,
        0
      ),
      items,
    };
  }

  private generateRecoveryCode() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  private async createCheckoutAttempt(
    cart: any,
    userId: string,
    provider = "stripe"
  ) {
    const snapshot = this.buildCartSnapshot(cart);

    await prisma.checkoutRecovery.updateMany({
      where: {
        userId,
        status: CHECKOUT_RECOVERY_STATUS.OPEN,
      },
      data: {
        status: CHECKOUT_RECOVERY_STATUS.EXPIRED,
      },
    });

    let code = this.generateRecoveryCode();
    while (await prisma.checkoutRecovery.findUnique({ where: { code } })) {
      code = this.generateRecoveryCode();
    }

    return prisma.checkoutAttempt.create({
      data: {
        userId,
        cartId: cart.id,
        provider,
        amount: snapshot.subtotal,
        cartSnapshot: snapshot,
        recovery: {
          create: {
            userId,
            cartId: cart.id,
            code,
            cartSnapshot: snapshot,
          },
        },
      },
      include: {
        recovery: true,
      },
    });
  }

  private async markCheckoutRecovered(
    attemptId: string | undefined,
    status: CHECKOUT_ATTEMPT_STATUS,
    userId: string,
    cartId: string
  ) {
    if (attemptId) {
      await prisma.checkoutAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          recovery: {
            update: {
              status: CHECKOUT_RECOVERY_STATUS.RESOLVED,
              resumedAt: new Date(),
            },
          },
        },
      });

      return;
    }

    const latestAttempt = await prisma.checkoutAttempt.findFirst({
      where: {
        userId,
        cartId,
        status: CHECKOUT_ATTEMPT_STATUS.STARTED,
      },
      orderBy: { createdAt: "desc" },
    });

    if (latestAttempt) {
      await prisma.checkoutAttempt.update({
        where: { id: latestAttempt.id },
        data: {
          status,
          recovery: {
            update: {
              status: CHECKOUT_RECOVERY_STATUS.RESOLVED,
              resumedAt: new Date(),
            },
          },
        },
      });
    }
  }

  private async markLatestAttemptState(
    userId: string,
    status: CHECKOUT_ATTEMPT_STATUS,
    reason?: string
  ) {
    const latestAttempt = await prisma.checkoutAttempt.findFirst({
      where: {
        userId,
        status: CHECKOUT_ATTEMPT_STATUS.STARTED,
      },
      include: {
        recovery: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestAttempt) {
      return null;
    }

    const updatedAttempt = await prisma.checkoutAttempt.update({
      where: { id: latestAttempt.id },
      data: {
        status,
        failureReason: reason,
        recovery: latestAttempt.recovery
          ? {
              update: {
                status: CHECKOUT_RECOVERY_STATUS.OPEN,
                lastError: reason || latestAttempt.recovery.lastError,
              },
            }
          : undefined,
      },
      include: {
        recovery: true,
      },
    });

    const snapshot = updatedAttempt.cartSnapshot as any;
    await this.clearSharedCartCheckoutState(
      typeof snapshot?.sharedCartCode === "string"
        ? snapshot.sharedCartCode
        : null
    );
    this.emitSharedCartCheckoutUpdate(
      typeof snapshot?.sharedCartCode === "string"
        ? snapshot.sharedCartCode
        : null
    );

    return updatedAttempt;
  }

  private async createDevelopmentCheckout(
    cart: any,
    userId: string,
    clientUrl: string,
    attemptId?: string
  ) {
    const order = await prisma.$transaction(async (tx: any) => {
      const amount = this.calculateAmount(cart);

      const createdOrder = await tx.order.create({
        data: {
          userId,
          goalTemplateId: cart.goalTemplateId || null,
          goalBundleId: cart.goalBundleId || null,
          amount,
          status: "PROCESSING",
          orderItems: {
            create: cart.cartItems.map((item: any) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant.price,
            })),
          },
          trackingEvents: {
            create: [
              buildOrderTrackingEventData({
                status: TRANSACTION_STATUS.PENDING,
                occurredAt: new Date(),
              }),
              buildOrderTrackingEventData({
                status: TRANSACTION_STATUS.PROCESSING,
                occurredAt: new Date(),
              }),
            ],
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          userId,
          method: "DEV_CHECKOUT",
          amount,
          status: PAYMENT_STATUS.PAID,
        },
      });

      await tx.transaction.create({
        data: {
          orderId: createdOrder.id,
          status: TRANSACTION_STATUS.PROCESSING,
          transactionDate: new Date(),
        },
      });

      await tx.shipment.create({
        data: {
          orderId: createdOrder.id,
          carrier: "Dev Carrier",
          trackingNumber: `DEV-${Math.random()
            .toString(36)
            .slice(2, 10)
            .toUpperCase()}`,
          shippedDate: new Date(),
          deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      for (const item of cart.cartItems) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: {
            stock: true,
            product: { select: { id: true, salesCount: true } },
          },
        });

        if (!variant) {
          throw new AppError(404, `Variant not found: ${item.variantId}`);
        }

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: variant.stock - item.quantity },
        });

        await tx.product.update({
          where: { id: variant.product.id },
          data: { salesCount: variant.product.salesCount + item.quantity },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          status: CART_STATUS.CONVERTED,
          goalTemplateId: null,
          goalBundleId: null,
        },
      });

      return createdOrder;
    });

    await this.markCheckoutRecovered(
      attemptId,
      CHECKOUT_ATTEMPT_STATUS.COMPLETED,
      userId,
      cart.id
    );

    this.io?.to(`user:${userId}:orders`).emit("orderUpdated", {
      type: "order.created",
      orderId: order.id,
      source: "dev-checkout",
    });

    if (cart.sharedCart?.code) {
      await this.setSharedCartCheckoutState(cart.sharedCart.code, {
        status: "COMPLETED",
        startedAt: new Date().toISOString(),
        startedByName: null,
        startedByUserId: userId,
        completedAt: new Date().toISOString(),
      });
      this.emitSharedCartCheckoutUpdate(cart.sharedCart.code);
    }

    return {
      orderId: order.id,
      redirectUrl: `${clientUrl}/payment-success?from=checkout&orderId=${order.id}${cart.sharedCart?.code ? `&sharedCartCode=${cart.sharedCart.code}` : ""}`,
    };
  }

  private async getRecoveryOrThrow(userId: string) {
    const recovery = await prisma.checkoutRecovery.findFirst({
      where: {
        userId,
        status: CHECKOUT_RECOVERY_STATUS.OPEN,
      },
      include: {
        checkoutAttempt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!recovery) {
      throw new AppError(404, "No checkout recovery is waiting for you");
    }

    return recovery;
  }

  private async getCartWithItems(cartId: string) {
    return prisma.cart.findUnique({
      where: { id: cartId },
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
    });
  }

  async createStripeSession(cart: any, userId: string, provider = "stripe") {
    for (const item of cart.cartItems) {
      if (item.variant.stock < item.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for variant ${item.variant.sku}: only ${item.variant.stock} available`
        );
      }
    }

    const attempt = await this.createCheckoutAttempt(cart, userId, provider);

    const lineItems = cart.cartItems.map((item: any) => {
      const imageUrl = validImage(safeImage(item.variant.product.images));

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.variant.product.name} (${item.variant.sku})`,
            images: [imageUrl],
            metadata: { variantId: item.variantId },
          },
          unit_amount: Math.round(item.variant.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const isProduction = process.env.NODE_ENV === "production";
    const clientUrl = this.getClientUrl();

    if (!isProduction) {
      return this.createDevelopmentCheckout(
        cart,
        userId,
        clientUrl,
        attempt.id
      );
    }

    const session = await (stripe as any).checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "MX", "EG"],
      },
      mode: "payment",
      success_url: `${clientUrl}/payment-success${cart.sharedCart?.code ? `?sharedCartCode=${cart.sharedCart.code}` : ""}`,
      cancel_url: `${clientUrl}/cancel${cart.sharedCart?.code ? `?sharedCartCode=${cart.sharedCart.code}` : ""}`,
      metadata: {
        userId,
        cartId: cart.id,
        attemptId: attempt.id,
        sharedCartCode: cart.sharedCart?.code || "",
      },
    });

    await prisma.checkoutAttempt.update({
      where: { id: attempt.id },
      data: {
        checkoutReference: session.id,
      },
    });

    return { sessionId: session.id, recoveryCode: attempt.recovery?.code };
  }

  async getActiveRecovery(userId: string) {
    return prisma.checkoutRecovery.findFirst({
      where: {
        userId,
        status: CHECKOUT_RECOVERY_STATUS.OPEN,
      },
      include: {
        checkoutAttempt: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async restoreRecoveryCart(userId: string) {
    const recovery = await this.getRecoveryOrThrow(userId);
    const snapshot = recovery.cartSnapshot as any;

    let cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: CART_STATUS.ACTIVE,
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    const items = Array.isArray(snapshot?.items) ? snapshot.items : [];

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, stock: true },
        });

        if (!variant || variant.stock <= 0) {
          continue;
        }

        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: item.variantId,
            quantity: Math.min(item.quantity, variant.stock),
          },
        });
      }

      await tx.checkoutRecovery.update({
        where: { id: recovery.id },
        data: {
          cartId: cart.id,
          cartSnapshot: {
            ...(snapshot || {}),
            cartId: cart.id,
          },
          updatedAt: new Date(),
        },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          goalTemplateId:
            typeof snapshot?.goalTemplateId === "string"
              ? snapshot.goalTemplateId
              : null,
          goalBundleId:
            typeof snapshot?.goalBundleId === "string"
              ? snapshot.goalBundleId
              : null,
        },
      });
    });

    return this.getCartWithItems(cart.id);
  }

  async retryCheckout(userId: string) {
    const recovery = await this.getRecoveryOrThrow(userId);
    let cart = await this.getCartWithItems(recovery.cartId);

    if (!cart || cart.userId !== userId || cart.cartItems.length === 0) {
      cart = await this.restoreRecoveryCart(userId);
    }

    if (!cart || cart.cartItems.length === 0) {
      throw new AppError(400, "There are no saved items available to retry");
    }

    await prisma.checkoutRecovery.update({
      where: { id: recovery.id },
      data: {
        resumedAt: new Date(),
      },
    });

    return this.createStripeSession(cart, userId, "recovery-retry");
  }

  async createDevelopmentFallback(userId: string) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError(400, "Development fallback is not available in production");
    }

    const recovery = await this.getRecoveryOrThrow(userId);
    let cart = await this.getCartWithItems(recovery.cartId);

    if (!cart || cart.userId !== userId || cart.cartItems.length === 0) {
      cart = await this.restoreRecoveryCart(userId);
    }

    if (!cart || cart.cartItems.length === 0) {
      throw new AppError(400, "There are no saved items available to recover");
    }

    const attempt = await this.createCheckoutAttempt(cart, userId, "dev-fallback");
    return this.createDevelopmentCheckout(
      cart,
      userId,
      this.getClientUrl(),
      attempt.id
    );
  }

  async createSupportHandoff(userId: string, reason?: string) {
    const recovery = await this.getActiveRecovery(userId);
    const activeCart = await prisma.cart.findFirst({
      where: {
        userId,
        status: CART_STATUS.ACTIVE,
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

    const snapshot = recovery?.cartSnapshot || (activeCart ? this.buildCartSnapshot(activeCart) : null);

    let chat = await prisma.chat.findFirst({
      where: {
        userId,
        status: "OPEN",
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { userId },
      });

      this.io?.to("admin").emit("chatCreated", chat);
    }

    const items =
      Array.isArray((snapshot as any)?.items) && (snapshot as any).items.length
        ? (snapshot as any).items
            .slice(0, 4)
            .map((item: any) => `${item.productName} x${item.quantity}`)
            .join(", ")
        : "No cart snapshot available";

    const message = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId: userId,
        content: `Need help with checkout recovery.${reason ? ` Reason: ${reason}.` : ""} Saved items: ${items}.`,
      },
    });

    this.io?.to(`chat:${chat.id}`).emit("newMessage", message);

    if (recovery) {
      await prisma.checkoutRecovery.update({
        where: { id: recovery.id },
        data: {
          chatId: chat.id,
          lastError: reason || recovery.lastError || "Support requested",
        },
      });
    }

    return {
      chatId: chat.id,
      recoveryCode: recovery?.code || null,
    };
  }

  async markCheckoutFailed(userId: string, reason?: string) {
    return this.markLatestAttemptState(
      userId,
      CHECKOUT_ATTEMPT_STATUS.FAILED,
      reason || "Payment failed during checkout."
    );
  }

  async markCheckoutCanceled(userId: string, reason?: string) {
    return this.markLatestAttemptState(
      userId,
      CHECKOUT_ATTEMPT_STATUS.CANCELED,
      reason || "Checkout was canceled before payment completed."
    );
  }
}
