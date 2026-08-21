import express from "express";
import optionalAuth from "@/shared/middlewares/optionalAuth";
import { makeShoppingAssistantController } from "./shopping-assistant.factory";

const router = express.Router();
const shoppingAssistantController = makeShoppingAssistantController();

router.post("/message", optionalAuth, shoppingAssistantController.sendMessage);

export default router;
