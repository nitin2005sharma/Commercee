import { Request, Response } from "express";
import asyncHandler from "@/shared/utils/asyncHandler";
import sendResponse from "@/shared/utils/sendResponse";
import {
  SHARED_CART_ASSIGNMENT_STATUS,
  SHARED_CART_INVITE_MODE,
  SHARED_CART_VOTE_TYPE,
} from "@prisma/client";
import AppError from "@/shared/errors/AppError";
import { SharedCartService } from "./shared-cart.service";

export class SharedCartController {
  constructor(private sharedCartService: SharedCartService) {}

  private getActor(req: Request) {
    return {
      userId: req.user?.id,
      sessionId: req.session?.id,
      displayName: req.body?.displayName,
    };
  }

  createSharedCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const sharedCart = await this.sharedCartService.createSharedCart(
      userId,
      req.body?.title,
      {
        cartId: req.body?.cartId,
        goalBundleId: req.body?.goalBundleId,
        inviteMode: req.body?.inviteMode as SHARED_CART_INVITE_MODE | undefined,
        isReadOnly:
          typeof req.body?.isReadOnly === "boolean"
            ? req.body.isReadOnly
            : undefined,
        expiresAt:
          typeof req.body?.expiresAt === "string" || req.body?.expiresAt === null
            ? req.body.expiresAt
            : undefined,
      }
    );

    sendResponse(res, 201, {
      data: { sharedCart },
      message: "Shared cart created successfully",
    });
  });

  getSharedCart = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.getSharedCart(req.params.code);

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Shared cart retrieved successfully",
    });
  });

  joinSharedCart = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.joinSharedCart(
      req.params.code,
      this.getActor(req)
    );

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Joined shared cart successfully",
    });
  });

  updateSharedCartItem = asyncHandler(async (req: Request, res: Response) => {
    const { variantId, quantity } = req.body;
    const sharedCart = await this.sharedCartService.updateSharedCartItem(
      req.params.code,
      this.getActor(req),
      variantId,
      Number(quantity)
    );

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Shared cart updated successfully",
    });
  });

  removeSharedCartItem = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.removeSharedCartItem(
      req.params.code,
      this.getActor(req),
      req.params.itemId
    );

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Shared cart item removed successfully",
    });
  });

  voteOnItem = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.voteOnItem(
      req.params.code,
      this.getActor(req),
      req.body.variantId,
      req.body.vote as SHARED_CART_VOTE_TYPE
    );

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Shared cart vote saved successfully",
    });
  });

  addNote = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.addNote(
      req.params.code,
      this.getActor(req),
      req.body.content,
      req.body.variantId
    );

    sendResponse(res, 201, {
      data: { sharedCart },
      message: "Shared cart note added successfully",
    });
  });

  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.sendMessage(
      req.params.code,
      this.getActor(req),
      req.body.content,
      req.body.variantId
    );

    sendResponse(res, 201, {
      data: { sharedCart },
      message: "Shared cart message sent successfully",
    });
  });

  assignItem = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.assignItem(
      req.params.code,
      this.getActor(req),
      {
        variantId: req.body.variantId,
        quantity:
          typeof req.body.quantity === "number"
            ? req.body.quantity
            : Number(req.body.quantity),
        status: req.body.status as SHARED_CART_ASSIGNMENT_STATUS | undefined,
      }
    );

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Shared cart assignment updated successfully",
    });
  });

  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.updateSettings(
      req.params.code,
      this.getActor(req),
      {
        title: req.body?.title,
        inviteMode: req.body?.inviteMode as SHARED_CART_INVITE_MODE | undefined,
        isReadOnly:
          typeof req.body?.isReadOnly === "boolean"
            ? req.body.isReadOnly
            : undefined,
        expiresAt:
          typeof req.body?.expiresAt === "string" || req.body?.expiresAt === null
            ? req.body.expiresAt
            : undefined,
      }
    );

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Shared cart settings updated successfully",
    });
  });

  regenerateInvite = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.regenerateInvite(
      req.params.code,
      this.getActor(req)
    );

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Shared cart invite regenerated successfully",
    });
  });

  initiateCheckout = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.sharedCartService.initiateCheckout(
      req.params.code,
      this.getActor(req)
    );

    sendResponse(res, 200, {
      data: result.session,
      meta: {
        sharedCart: result.sharedCart,
      },
      message: "Shared cart checkout started successfully",
    });
  });

  releaseCheckout = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.sharedCartService.releaseCheckout(
      req.params.code,
      this.getActor(req)
    );

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Shared cart checkout lock released successfully",
    });
  });
}
