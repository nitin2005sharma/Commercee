import prisma from "@/infra/database/database.config";
import redisClient from "@/infra/cache/redis";
import AppError from "@/shared/errors/AppError";
import {
  ORDER_TRACKING_EVENT_SOURCE,
  TRANSACTION_STATUS,
} from "@prisma/client";
import {
  buildOrderTrackingEventData,
  TRACKING_PROGRESS_SEQUENCE,
  TRACKING_TERMINAL_STATUSES,
} from "../order/orderTracking.helpers";
import { ShipmentRepository } from "./shipment.repository";
import { AfterShipTrackingProvider } from "./aftershipTracking.provider";
import { LiveTrackingSnapshot } from "./courierTracking.types";

type CreateShipmentInput = {
  orderId: string;
  trackingNumber: string;
  shippedDate: Date;
  deliveryDate?: Date | null;
  carrier: string;
};

type SyncTrackingResult = {
  order: any;
  liveTracking: {
    provider: string | null;
    carrierSlug?: string | null;
    carrierName?: string | null;
    courierTrackingLink?: string | null;
    syncedAt: string | null;
    liveEnabled: boolean;
  } | null;
  synced: boolean;
};

const TRACKING_SYNC_TTL_SECONDS = 60 * 10;

export class ShipmentService {
  private readonly trackingProvider = new AfterShipTrackingProvider();

  constructor(private shipmentRepository: ShipmentRepository) {}

  private getTrackingSyncKey(orderId: string) {
    return `live-tracking-sync:${orderId}`;
  }

  private getStatusRank(status: TRANSACTION_STATUS) {
    const progressIndex = TRACKING_PROGRESS_SEQUENCE.indexOf(status);
    if (progressIndex >= 0) {
      return progressIndex;
    }

    if (TRACKING_TERMINAL_STATUSES.includes(status)) {
      return TRACKING_PROGRESS_SEQUENCE.length + TRACKING_TERMINAL_STATUSES.indexOf(status);
    }

    return -1;
  }

  private getMostAdvancedStatus(
    currentStatus: TRANSACTION_STATUS,
    incomingStatus: TRANSACTION_STATUS
  ) {
    return this.getStatusRank(incomingStatus) >= this.getStatusRank(currentStatus)
      ? incomingStatus
      : currentStatus;
  }

  private buildEventKey(event: {
    status: TRANSACTION_STATUS;
    title: string;
    occurredAt: Date | string;
  }) {
    return [
      event.status,
      event.title.trim().toLowerCase(),
      new Date(event.occurredAt).toISOString(),
    ].join(":");
  }

  private async loadOrderTrackingContext(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        orderItems: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        address: true,
        shipment: true,
        transaction: true,
        trackingEvents: {
          orderBy: { occurredAt: "asc" },
        },
      },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    return order;
  }

  private buildLiveTrackingMeta(snapshot: LiveTrackingSnapshot | null) {
    if (!snapshot) {
      return {
        provider: null,
        carrierSlug: null,
        carrierName: null,
        courierTrackingLink: null,
        syncedAt: null,
        liveEnabled: this.trackingProvider.isEnabled(),
      };
    }

    return {
      provider: snapshot.provider,
      carrierSlug: snapshot.carrierSlug || null,
      carrierName: snapshot.carrierName || null,
      courierTrackingLink: snapshot.courierTrackingLink || null,
      syncedAt: new Date().toISOString(),
      liveEnabled: true,
    };
  }

  private attachLiveTrackingMeta(order: any, snapshot: LiveTrackingSnapshot | null) {
    return {
      ...order,
      liveTrackingMeta: this.buildLiveTrackingMeta(snapshot),
    };
  }

  async createShipment(data: CreateShipmentInput) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        shipment: true,
      },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    const shipment = await this.shipmentRepository.createShipment({
      ...data,
      deliveryDate: data.deliveryDate || null,
    });

    await prisma.transaction.upsert({
      where: { orderId: data.orderId },
      create: {
        orderId: data.orderId,
        status: TRANSACTION_STATUS.SHIPPED,
      },
      update: {
        status: TRANSACTION_STATUS.SHIPPED,
      },
    });

    await prisma.orderTrackingEvent.create({
      data: buildOrderTrackingEventData({
        status: TRANSACTION_STATUS.SHIPPED,
        title: "Shipment created",
        description: `Tracking number ${data.trackingNumber} was assigned to this order.`,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        source: ORDER_TRACKING_EVENT_SOURCE.ADMIN,
        occurredAt: data.shippedDate,
      }),
    });

    await redisClient.del(this.getTrackingSyncKey(data.orderId));

    const syncResult = await this.syncTrackingForOrder(data.orderId, {
      force: true,
      throwOnProviderFailure: false,
    });

    return {
      shipment,
      liveTracking: syncResult.liveTracking,
    };
  }

  async syncTrackingForOrder(
    orderId: string,
    options?: {
      force?: boolean;
      throwOnProviderFailure?: boolean;
    }
  ): Promise<SyncTrackingResult> {
    const order = await this.loadOrderTrackingContext(orderId);

    if (!order.shipment?.trackingNumber) {
      return {
        order: this.attachLiveTrackingMeta(order, null),
        liveTracking: null,
        synced: false,
      };
    }

    if (!this.trackingProvider.isEnabled()) {
      return {
        order: this.attachLiveTrackingMeta(order, null),
        liveTracking: this.buildLiveTrackingMeta(null),
        synced: false,
      };
    }

    const syncKey = this.getTrackingSyncKey(orderId);
    const canUseCache = !options?.force && (await redisClient.get(syncKey));

    if (canUseCache) {
      const refreshedOrder = await this.loadOrderTrackingContext(orderId);
      return {
        order: this.attachLiveTrackingMeta(refreshedOrder, null),
        liveTracking: this.buildLiveTrackingMeta(null),
        synced: false,
      };
    }

    let snapshot: LiveTrackingSnapshot | null = null;

    try {
      snapshot = await this.trackingProvider.fetchTracking({
        orderId,
        trackingNumber: order.shipment.trackingNumber,
        carrier: order.shipment.carrier,
      });
    } catch (error) {
      if (options?.throwOnProviderFailure) {
        throw error;
      }

      return {
        order: this.attachLiveTrackingMeta(order, null),
        liveTracking: this.buildLiveTrackingMeta(null),
        synced: false,
      };
    }

    if (!snapshot) {
      return {
        order: this.attachLiveTrackingMeta(order, null),
        liveTracking: this.buildLiveTrackingMeta(null),
        synced: false,
      };
    }

    const currentStatus = order.transaction?.status || TRANSACTION_STATUS.PENDING;
    const nextStatus = this.getMostAdvancedStatus(currentStatus, snapshot.currentStatus);
    const existingEventKeys = new Set(
      (order.trackingEvents || []).map((event) => this.buildEventKey(event))
    );
    const newEvents = snapshot.checkpoints
      .filter((checkpoint) => !existingEventKeys.has(this.buildEventKey(checkpoint)))
      .map((checkpoint) =>
        buildOrderTrackingEventData({
          status: checkpoint.status,
          title: checkpoint.title,
          description: checkpoint.description,
          location: checkpoint.location,
          carrier: checkpoint.carrier || snapshot.carrierName || order.shipment?.carrier,
          trackingNumber: checkpoint.trackingNumber || snapshot.trackingNumber,
          source: ORDER_TRACKING_EVENT_SOURCE.SYSTEM,
          occurredAt: checkpoint.occurredAt,
        })
      );

    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { orderId },
        data: {
          carrier: snapshot.carrierName || order.shipment?.carrier || "Carrier update",
          trackingNumber: snapshot.trackingNumber,
          deliveryDate:
            snapshot.currentStatus === TRANSACTION_STATUS.DELIVERED
              ? snapshot.lastUpdatedAt || snapshot.estimatedDeliveryDate || order.shipment?.deliveryDate
              : snapshot.estimatedDeliveryDate || order.shipment?.deliveryDate,
        },
      });

      await tx.transaction.upsert({
        where: { orderId },
        create: {
          orderId,
          status: nextStatus,
        },
        update: {
          status: nextStatus,
        },
      });

      if (newEvents.length) {
        await tx.orderTrackingEvent.createMany({
          data: newEvents.map((event) => ({
            orderId,
            ...event,
          })),
        });
      }
    });

    await redisClient.set(syncKey, new Date().toISOString(), "EX", TRACKING_SYNC_TTL_SECONDS);

    const refreshedOrder = await this.loadOrderTrackingContext(orderId);

    return {
      order: this.attachLiveTrackingMeta(refreshedOrder, snapshot),
      liveTracking: this.buildLiveTrackingMeta(snapshot),
      synced: true,
    };
  }
}
