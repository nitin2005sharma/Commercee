import express from "express";
import { Server as SocketIOServer } from "socket.io";
import protect from "@/shared/middlewares/protect";
import { makeCheckoutController } from "./checkout.factory";

export const configureCheckoutRoutes = (io?: SocketIOServer) => {
const router = express.Router();
const checkoutController = makeCheckoutController(io);

/**
 * @swagger
 * /checkout:
 *   post:
 *     summary: Initiate checkout
 *     description: Initiates the checkout process for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Checkout successfully initiated.
 *       400:
 *         description: Invalid input data or missing required fields.
 *       401:
 *         description: Unauthorized. Token is invalid or missing.
 */
router.post("/", protect, checkoutController.initiateCheckout);
router.get("/recovery", protect, checkoutController.getActiveRecovery);
router.post("/retry", protect, checkoutController.retryCheckout);
router.post("/restore", protect, checkoutController.restoreCart);
router.post("/dev-fallback", protect, checkoutController.createDevelopmentFallback);
router.post("/support-handoff", protect, checkoutController.supportHandoff);
router.post("/mark-failed", protect, checkoutController.markCheckoutFailed);
router.post("/mark-canceled", protect, checkoutController.markCheckoutCanceled);

return router;
};
