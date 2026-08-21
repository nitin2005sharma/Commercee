import { Request, Response } from "express";
import asyncHandler from "@/shared/utils/asyncHandler";
import sendResponse from "@/shared/utils/sendResponse";
import { ShoppingAssistantService } from "./shopping-assistant.service";

export class ShoppingAssistantController {
  constructor(private shoppingAssistantService: ShoppingAssistantService) {}

  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const assistant = await this.shoppingAssistantService.respond({
      message: req.body?.message,
      history: req.body?.history,
    });

    sendResponse(res, 200, {
      data: {
        assistant,
      },
      message: "Shopping assistant response generated successfully",
    });
  });
}
