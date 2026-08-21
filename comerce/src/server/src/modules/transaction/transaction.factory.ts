import { Server as SocketIOServer } from "socket.io";
import { TransactionController } from "./transaction.controller";
import { TransactionRepository } from "./transaction.repository";
import { TransactionService } from "./transaction.service";

export const makeTransactionController = (io?: SocketIOServer) => {
  const repo = new TransactionRepository();
  const service = new TransactionService(repo, io);
  const controller = new TransactionController(service);
  return controller;
};
