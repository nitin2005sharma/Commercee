import prisma from "@/infra/database/database.config";
import AppError from "@/shared/errors/AppError";
import { Server as SocketIOServer } from "socket.io";
import {
  ORDER_TRACKING_EVENT_SOURCE,
  TRANSACTION_STATUS,
} from "@prisma/client";
import { makeLogsService } from "../logs/logs.factory";
import { TransactionRepository } from "./transaction.repository";
import {
  buildOrderTrackingEventData,
  shouldHaveShipmentRecord,
} from "../order/orderTracking.helpers";

type UpdateTransactionStatusInput = {
  status: TRANSACTION_STATUS;
  title?: string;
  description?: string;
  location?: string;
  carrier?: string;
  trackingNumber?: string;
  deliveryDate?: Date | string;
  occurredAt?: Date | string;
};

export class TransactionService {
  private logsService = makeLogsService();

  constructor(
    private transactionRepository: TransactionRepository,
    private io?: SocketIOServer
  ) {}

  private emitOrderEvent(userId: string, payload: Record<string, unknown>) {
    this.io?.to(`user:${userId}:orders`).emit("orderUpdated", payload);
  }

  private parseOptionalDate(value?: Date | string) {
    if (!value) {
      return undefined;
    }

    const parsed = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new AppError(400, "Invalid date provided");
    }

    return parsed;
  }

  private buildAutoTrackingNumber(transactionId: string) {
    return `TRK-${transactionId.slice(0, 8).toUpperCase()}-${Date.now()
      .toString()
      .slice(-6)}`;
  }

  async getAllTransactions() {
    const transactions = await this.transactionRepository.findMany();
    return transactions;
  }

  async getTransactionById(id: string) {
    const transaction = await this.transactionRepository.findById(id);
    return transaction;
  }

  async updateTransactionStatus(
    id: string,
    data: UpdateTransactionStatusInput
  ) {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new AppError(404, "Transaction not found");
    }

    const occurredAt = this.parseOptionalDate(data.occurredAt) || new Date();
    const requestedDeliveryDate = this.parseOptionalDate(data.deliveryDate);
    const normalizedCarrier = data.carrier?.trim();
    const normalizedTrackingNumber = data.trackingNumber?.trim();
    const shouldUpsertShipment =
      shouldHaveShipmentRecord(data.status) ||
      Boolean(normalizedCarrier || normalizedTrackingNumber || requestedDeliveryDate);

    const result = await prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: { status: data.status },
      });

      await tx.order.update({
        where: { id: transaction.orderId },
        data: { status: data.status },
      });

      let shipment = transaction.order.shipment;

      if (shouldUpsertShipment) {
        const shipmentData: Record<string, Date | string | null> = {};

        if (normalizedCarrier) {
          shipmentData.carrier = normalizedCarrier;
        }

        if (normalizedTrackingNumber) {
          shipmentData.trackingNumber = normalizedTrackingNumber;
        }

        if (
          (
            [
              TRANSACTION_STATUS.SHIPPED,
              TRANSACTION_STATUS.IN_TRANSIT,
              TRANSACTION_STATUS.DELIVERED,
            ] as TRANSACTION_STATUS[]
          ).includes(data.status)
        ) {
          shipmentData.shippedDate = shipment?.shippedDate || occurredAt;
        }

        if (data.status === TRANSACTION_STATUS.DELIVERED) {
          shipmentData.deliveryDate = requestedDeliveryDate || occurredAt;
        } else if (requestedDeliveryDate) {
          shipmentData.deliveryDate = requestedDeliveryDate;
        }

        if (shipment) {
          shipment = await tx.shipment.update({
            where: { orderId: transaction.orderId },
            data: shipmentData,
          });
        } else {
          shipment = await tx.shipment.create({
            data: {
              orderId: transaction.orderId,
              carrier: normalizedCarrier || "Carrier pending",
              trackingNumber:
                normalizedTrackingNumber || this.buildAutoTrackingNumber(id),
              shippedDate:
                (shipmentData.shippedDate as Date | undefined) || occurredAt,
              deliveryDate:
                (shipmentData.deliveryDate as Date | undefined) || null,
            },
          });
        }
      }

      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: transaction.orderId,
          ...buildOrderTrackingEventData({
            status: data.status,
            title: data.title,
            description: data.description,
            location: data.location,
            carrier: shipment?.carrier || normalizedCarrier,
            trackingNumber:
              shipment?.trackingNumber || normalizedTrackingNumber,
            source: ORDER_TRACKING_EVENT_SOURCE.ADMIN,
            occurredAt,
          }),
        },
      });

      return { updatedTransaction, trackingEvent, shipment };
    });

    this.logsService.info("Transaction status updated", {
      transactionId: id,
      orderId: transaction.orderId,
      userId: transaction.order.userId,
      status: data.status,
    });

    this.emitOrderEvent(transaction.order.userId, {
      type: "order.tracking.updated",
      orderId: transaction.orderId,
      status: data.status,
      trackingEvent: {
        id: result.trackingEvent.id,
        status: result.trackingEvent.status,
        title: result.trackingEvent.title,
        description: result.trackingEvent.description,
        location: result.trackingEvent.location,
        carrier: result.trackingEvent.carrier,
        trackingNumber: result.trackingEvent.trackingNumber,
        occurredAt: result.trackingEvent.occurredAt,
      },
    });

    return this.transactionRepository.findById(id);
  }

  async deleteTransaction(id: string) {
    await this.transactionRepository.deleteTransaction(id);
  }
}
