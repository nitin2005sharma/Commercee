import { Request, Response } from "express";
import asyncHandler from "@/shared/utils/asyncHandler";
import sendResponse from "@/shared/utils/sendResponse";
import { CheckoutService } from "./checkout.service";
import AppError from "@/shared/errors/AppError";
import { CartService } from "../cart/cart.service";
import { makeLogsService } from "../logs/logs.factory";

export class CheckoutController {
  private logsService = makeLogsService();

  constructor(
    private checkoutService: CheckoutService,
    private cartService: CartService
  ) {}

  initiateCheckout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const cart = await this.cartService.getOrCreateCart(userId);
    if (!cart.cartItems || cart.cartItems.length === 0) {
      throw new AppError(400, "Cart is empty");
    }

    const session = await this.checkoutService.createStripeSession(cart, userId);
    sendResponse(res, 200, {
      data: session,
      message: "Checkout initiated successfully",
    });

    this.cartService.logCartEvent(cart.id, "CHECKOUT_STARTED", userId);

    const checkoutReference =
      "sessionId" in session
        ? session.sessionId
        : "orderId" in session
          ? session.orderId
          : "local-dev-checkout";

    this.logsService.info("Checkout initiated", {
      userId,
      sessionId: checkoutReference,
      timePeriod: 0,
    });
  });

  getActiveRecovery = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const recovery = await this.checkoutService.getActiveRecovery(userId);

    sendResponse(res, 200, {
      data: { recovery },
      message: "Checkout recovery retrieved successfully",
    });
  });

  retryCheckout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const session = await this.checkoutService.retryCheckout(userId);

    sendResponse(res, 200, {
      data: session,
      message: "Checkout retry initiated successfully",
    });
  });

  restoreCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const cart = await this.checkoutService.restoreRecoveryCart(userId);

    sendResponse(res, 200, {
      data: { cart },
      message: "Saved cart restored successfully",
    });
  });

  createDevelopmentFallback = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(400, "User not found");
      }

      const fallback = await this.checkoutService.createDevelopmentFallback(
        userId
      );

      sendResponse(res, 200, {
        data: fallback,
        message: "Development fallback order created successfully",
      });
    }
  );

  supportHandoff = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const result = await this.checkoutService.createSupportHandoff(
      userId,
      req.body?.reason
    );

    sendResponse(res, 200, {
      data: result,
      message: "Support handoff created successfully",
    });
  });

  markCheckoutFailed = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const attempt = await this.checkoutService.markCheckoutFailed(
      userId,
      req.body?.reason
    );

    sendResponse(res, 200, {
      data: { attempt },
      message: "Checkout marked as failed",
    });
  });

  markCheckoutCanceled = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const attempt = await this.checkoutService.markCheckoutCanceled(
      userId,
      req.body?.reason
    );

    sendResponse(res, 200, {
      data: { attempt },
      message: "Checkout marked as canceled",
    });
  });
}
