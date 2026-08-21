import { TRANSACTION_STATUS } from "@prisma/client";

export type LiveTrackingCheckpoint = {
  occurredAt: Date;
  status: TRANSACTION_STATUS;
  title: string;
  description: string;
  location?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
};

export type LiveTrackingSnapshot = {
  provider: string;
  trackingNumber: string;
  carrierSlug?: string | null;
  carrierName?: string | null;
  currentStatus: TRANSACTION_STATUS;
  currentLocation?: string | null;
  estimatedDeliveryDate?: Date | null;
  courierTrackingLink?: string | null;
  lastUpdatedAt?: Date | null;
  checkpoints: LiveTrackingCheckpoint[];
  raw?: unknown;
};
