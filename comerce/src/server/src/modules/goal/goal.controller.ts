import { Request, Response } from "express";
import asyncHandler from "@/shared/utils/asyncHandler";
import sendResponse from "@/shared/utils/sendResponse";
import { GoalService } from "./goal.service";

export class GoalController {
  constructor(private goalService: GoalService) {}

  listGoals = asyncHandler(async (_req: Request, res: Response) => {
    const goals = await this.goalService.listGoals();
    sendResponse(res, 200, {
      data: { goals },
      message: "Goal templates retrieved successfully",
    });
  });

  getGoal = asyncHandler(async (req: Request, res: Response) => {
    const goal = await this.goalService.getGoal(req.params.slug);
    sendResponse(res, 200, {
      data: { goal },
      message: "Goal template retrieved successfully",
    });
  });

  assembleGoal = asyncHandler(async (req: Request, res: Response) => {
    const {
      slug,
      budget,
      brief,
      bundleId,
      lockedStepKeys,
      selectedVariants,
      regenerateStepKeys,
    } = req.body;
    const bundle = await this.goalService.assembleGoalBundle(
      slug,
      {
        budget,
        brief,
        bundleId,
        lockedStepKeys,
        selectedVariants,
        regenerateStepKeys,
        userId: req.user?.id,
        sessionId: req.session?.id,
      }
    );
    sendResponse(res, 200, {
      data: { bundle },
      message: "Goal bundle assembled successfully",
    });
  });

  assembleCustomBundle = asyncHandler(async (req: Request, res: Response) => {
    const {
      budget,
      brief,
      bundleId,
      lockedItemKeys,
      selectedVariants,
      regenerateItemKeys,
    } = req.body;
    const bundle = await this.goalService.assembleCustomBundle({
      budget,
      brief,
      bundleId,
      lockedItemKeys,
      selectedVariants,
      regenerateItemKeys,
      userId: req.user?.id,
      sessionId: req.session?.id,
    });

    sendResponse(res, 200, {
      data: { bundle },
      message: "Custom bundle assembled successfully",
    });
  });

  listBundles = asyncHandler(async (req: Request, res: Response) => {
    const bundles = await this.goalService.listBundles({
      userId: req.user?.id,
      sessionId: req.session?.id,
    });

    sendResponse(res, 200, {
      data: { bundles },
      message: "Goal bundles retrieved successfully",
    });
  });

  listFrequentBundles = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const bundles = await this.goalService.listFrequentBundles(limit || 6);

    sendResponse(res, 200, {
      data: { bundles },
      message: "Frequent bundles retrieved successfully",
    });
  });

  getBundle = asyncHandler(async (req: Request, res: Response) => {
    const bundle = await this.goalService.getBundle(req.params.bundleId, {
      userId: req.user?.id,
      sessionId: req.session?.id,
    });

    sendResponse(res, 200, {
      data: { bundle },
      message: "Goal bundle retrieved successfully",
    });
  });

  applyBundleToCart = asyncHandler(async (req: Request, res: Response) => {
    const bundle = await this.goalService.applyBundleToCart(req.params.bundleId, {
      userId: req.user?.id,
      sessionId: req.session?.id,
    });

    sendResponse(res, 200, {
      data: { bundle },
      message: "Goal bundle added to cart successfully",
    });
  });

  shareBundle = asyncHandler(async (req: Request, res: Response) => {
    const sharedCart = await this.goalService.shareBundle(req.params.bundleId, {
      userId: req.user?.id,
      sessionId: req.session?.id,
      title: req.body?.title,
    });

    sendResponse(res, 200, {
      data: { sharedCart },
      message: "Goal bundle shared successfully",
    });
  });

  listGoalTemplatesAdmin = asyncHandler(async (_req: Request, res: Response) => {
    const goals = await this.goalService.listGoalTemplatesAdmin();

    sendResponse(res, 200, {
      data: { goals },
      message: "Goal templates retrieved successfully",
    });
  });

  createGoalTemplate = asyncHandler(async (req: Request, res: Response) => {
    const goal = await this.goalService.createGoalTemplate(req.body);

    sendResponse(res, 201, {
      data: { goal },
      message: "Goal template created successfully",
    });
  });

  updateGoalTemplate = asyncHandler(async (req: Request, res: Response) => {
    const goal = await this.goalService.updateGoalTemplate(
      req.params.templateId,
      req.body
    );

    sendResponse(res, 200, {
      data: { goal },
      message: "Goal template updated successfully",
    });
  });

  deleteGoalTemplate = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.goalService.deleteGoalTemplate(req.params.templateId);

    sendResponse(res, 200, {
      data: result,
      message: "Goal template deleted successfully",
    });
  });

  getGoalMetrics = asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await this.goalService.getGoalMetrics();

    sendResponse(res, 200, {
      data: { metrics },
      message: "Goal metrics retrieved successfully",
    });
  });
}
