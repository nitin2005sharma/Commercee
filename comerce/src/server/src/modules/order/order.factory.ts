import { Server as SocketIOServer } from "socket.io";
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

export const makeOrderController = (io?: SocketIOServer) => {
  const repository = new OrderRepository();
  const service = new OrderService(repository, io);
  return new OrderController(service);
};
