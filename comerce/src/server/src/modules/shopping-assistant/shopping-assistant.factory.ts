import { ShoppingAssistantController } from "./shopping-assistant.controller";
import { ShoppingAssistantService } from "./shopping-assistant.service";

export const makeShoppingAssistantController = () =>
  new ShoppingAssistantController(new ShoppingAssistantService());
