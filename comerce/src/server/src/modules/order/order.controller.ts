import { Request, Response } from "express";
import asyncHandler from "@/shared/utils/asyncHandler";
import sendResponse from "@/shared/utils/sendResponse";
import AppError from "@/shared/errors/AppError";
import { OrderService } from "./order.service";

export class OrderController {
  constructor(private orderService: OrderService) {}

  getAllOrders = asyncHandler(async (req: Request, res: Response) => {
    const orders = await this.orderService.getAllOrders();
    sendResponse(res, 200, {
      data: { orders },
      message: "Orders retrieved successfully",
    });
  });

  getUserOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(400, "User not found");
    }
    const orders = await this.orderService.getUserOrders(userId);
    sendResponse(res, 200, {
      data: { orders },
      message: "Orders retrieved successfully",
    });
  });

  lookupOrderTracking = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, email } = req.body;
    const order = await this.orderService.lookupOrderTracking(orderId, email);

    sendResponse(res, 200, {
      data: { order },
      message: "Order tracking details retrieved successfully",
    });
  });

  getOrderDetails = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(400, "User not found");
    }
    const order = await this.orderService.getOrderDetails(orderId, userId);
    sendResponse(res, 200, {
      data: { order },
      message: "Order details retrieved successfully",
    });
  });

  getOrderCompanion = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(400, "User not found");
    }
    const companion = await this.orderService.getOrderCompanion(orderId, userId);
    sendResponse(res, 200, {
      data: { companion },
      message: "Order companion retrieved successfully",
    });
  });

  getOrderGoalSuccess = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const goalSuccess = await this.orderService.getOrderGoalSuccess(
      orderId,
      userId
    );

    sendResponse(res, 200, {
      data: { goalSuccess },
      message: "Goal success tracking retrieved successfully",
    });
  });

  submitOrderGoalSuccess = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const goalSuccess = await this.orderService.submitOrderGoalSuccess(
      orderId,
      userId,
      req.body
    );

    sendResponse(res, 200, {
      data: { goalSuccess },
      message: "Goal success tracking saved successfully",
    });
  });

  createSupportHandoff = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    const handoff = await this.orderService.createSupportHandoff(
      orderId,
      userId,
      req.body
    );

    sendResponse(res, 200, {
      data: handoff,
      message: "Order support handoff created successfully",
    });
  });

  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { cartId } = req.body;
    if (!userId) {
      throw new AppError(400, "User not found");
    }
    if (!cartId) {
      throw new AppError(400, "Cart ID is required");
    }
    const order = await this.orderService.createOrderFromCart(userId, cartId);
    sendResponse(res, 201, {
      data: { order },
      message: "Order created successfully",
    });
  });

  createReminder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { remindAt, note } = req.body;

    if (!userId) {
      throw new AppError(400, "User not found");
    }

    if (!remindAt) {
      throw new AppError(400, "Reminder date is required");
    }

    const reminder = await this.orderService.createReminder(
      orderId,
      userId,
      new Date(remindAt),
      note
    );

    sendResponse(res, 201, {
      data: { reminder },
      message: "Order reminder created successfully",
    });
  });
}
