import express from "express";
import bodyParser from "body-parser";
import { Server as SocketIOServer } from "socket.io";
import { makeWebhookController } from "./webhook.factory";

export const configureWebhookRoutes = (io?: SocketIOServer) => {
const router = express.Router();
const webhookController = makeWebhookController(io);

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Handle webhook events
 *     description: Receives and processes incoming webhook events.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: string
 *             format: binary
 *     responses:
 *       200:
 *         description: Webhook processed successfully.
 *       400:
 *         description: Invalid webhook payload.
 */
router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  webhookController.handleWebhook
);

return router;
};
