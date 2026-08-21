import express from "express";
import { Server as SocketIOServer } from "socket.io";
import protect from "@/shared/middlewares/protect";
import optionalAuth from "@/shared/middlewares/optionalAuth";
import { SharedCartController } from "./shared-cart.controller";
import { SharedCartService } from "./shared-cart.service";

export const configureSharedCartRoutes = (io?: SocketIOServer) => {
  const router = express.Router();
  const sharedCartController = new SharedCartController(
    new SharedCartService(io)
  );

  router.post("/", protect, sharedCartController.createSharedCart);
  router.get("/:code", optionalAuth, sharedCartController.getSharedCart);
  router.post("/:code/join", optionalAuth, sharedCartController.joinSharedCart);
  router.post("/:code/items", optionalAuth, sharedCartController.updateSharedCartItem);
  router.delete(
    "/:code/items/:itemId",
    optionalAuth,
    sharedCartController.removeSharedCartItem
  );
  router.post("/:code/votes", optionalAuth, sharedCartController.voteOnItem);
  router.post("/:code/notes", optionalAuth, sharedCartController.addNote);
  router.post("/:code/messages", optionalAuth, sharedCartController.sendMessage);
  router.post("/:code/assignments", optionalAuth, sharedCartController.assignItem);
  router.post("/:code/checkout", optionalAuth, sharedCartController.initiateCheckout);
  router.post(
    "/:code/checkout/release",
    optionalAuth,
    sharedCartController.releaseCheckout
  );
  router.patch("/:code/settings", optionalAuth, sharedCartController.updateSettings);
  router.post(
    "/:code/regenerate-invite",
    optionalAuth,
    sharedCartController.regenerateInvite
  );

  return router;
};
