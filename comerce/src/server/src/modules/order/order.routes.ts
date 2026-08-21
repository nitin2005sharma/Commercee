import express from "express";
import { Server as SocketIOServer } from "socket.io";
import protect from "@/shared/middlewares/protect";
import authorizeRole from "@/shared/middlewares/authorizeRole";
import { makeOrderController } from "./order.factory";

export const configureOrderRoutes = (io?: SocketIOServer) => {
const router = express.Router();
const orderController = makeOrderController(io);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (admin only)
 *     description: Retrieves all orders in the system. Accessible only by admins and superadmins.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all orders.
 *       401:
 *         description: Unauthorized. Token is invalid or missing.
 *       403:
 *         description: Forbidden. User does not have the required role.
 */
router.get(
  "/",
  protect,
  authorizeRole("ADMIN", "SUPERADMIN"),
  orderController.getAllOrders
);
router.post("/lookup", orderController.lookupOrderTracking);

/**
 * @swagger
 * /orders/user:
 *   get:
 *     summary: Get user orders
 *     description: Retrieves all orders placed by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of orders placed by the user.
 *       401:
 *         description: Unauthorized. Token is invalid or missing.
 */
router.get("/user", protect, orderController.getUserOrders);
router.get("/:orderId/companion", protect, orderController.getOrderCompanion);
router.get("/:orderId/goal-success", protect, orderController.getOrderGoalSuccess);
router.post("/:orderId/goal-success", protect, orderController.submitOrderGoalSuccess);
router.post("/:orderId/support-handoff", protect, orderController.createSupportHandoff);
router.post("/:orderId/reminders", protect, orderController.createReminder);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order details
 *     description: Retrieves detailed information about a specific order.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to retrieve.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The details of the specified order.
 *       404:
 *         description: Order not found.
 *       401:
 *         description: Unauthorized. Token is invalid or missing.
 */
router.get("/:orderId", protect, orderController.getOrderDetails);

return router;
};
