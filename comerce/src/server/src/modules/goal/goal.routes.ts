import express from "express";
import { GoalController } from "./goal.controller";
import { GoalService } from "./goal.service";
import optionalAuth from "@/shared/middlewares/optionalAuth";
import protect from "@/shared/middlewares/protect";
import authorizeRole from "@/shared/middlewares/authorizeRole";

const router = express.Router();
const goalController = new GoalController(new GoalService());

router.get("/bundles", optionalAuth, goalController.listBundles);
router.get("/bundles/frequent", optionalAuth, goalController.listFrequentBundles);
router.get("/bundles/:bundleId", optionalAuth, goalController.getBundle);
router.post("/bundles/:bundleId/apply", optionalAuth, goalController.applyBundleToCart);
router.post("/bundles/:bundleId/share", protect, goalController.shareBundle);
router.post("/custom-bundles/assemble", optionalAuth, goalController.assembleCustomBundle);
router.get(
  "/admin/templates",
  protect,
  authorizeRole("ADMIN", "SUPERADMIN"),
  goalController.listGoalTemplatesAdmin
);
router.post(
  "/admin/templates",
  protect,
  authorizeRole("ADMIN", "SUPERADMIN"),
  goalController.createGoalTemplate
);
router.put(
  "/admin/templates/:templateId",
  protect,
  authorizeRole("ADMIN", "SUPERADMIN"),
  goalController.updateGoalTemplate
);
router.delete(
  "/admin/templates/:templateId",
  protect,
  authorizeRole("ADMIN", "SUPERADMIN"),
  goalController.deleteGoalTemplate
);
router.get(
  "/metrics",
  protect,
  authorizeRole("ADMIN", "SUPERADMIN"),
  goalController.getGoalMetrics
);
router.get("/", optionalAuth, goalController.listGoals);
router.post("/assemble", optionalAuth, goalController.assembleGoal);
router.get("/:slug", optionalAuth, goalController.getGoal);

export default router;
