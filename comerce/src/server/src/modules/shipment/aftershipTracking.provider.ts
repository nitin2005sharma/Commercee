import axios, { AxiosError } from "axios";
import { TRANSACTION_STATUS } from "@prisma/client";
import AppError from "@/shared/errors/AppError";
import {
  LiveTrackingCheckpoint,
  LiveTrackingSnapshot,
} from "./courierTracking.types";

type DetectCourierResult = {
  slug?: string | null;
  name?: string | null;
};

type SyncTrackingInput = {
  orderId: string;
  trackingNumber: string;
  carrier?: string | null;
};

const AFTERSHIP_BASE_URL =
  process.env.AFTERSHIP_API_BASE_URL ||
  "https://api.aftership.com/tracking/2025-07";

const readNested = <T = unknown>(value: any, paths: string[][]): T | undefined => {
  for (const path of paths) {
    let cursor = value;

    for (const key of path) {
      cursor = cursor?.[key];
    }

    if (cursor !== undefined && cursor !== null) {
      return cursor as T;
    }
  }

  return undefined;
};

const toDate = (value: unknown) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeText = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export class AfterShipTrackingProvider {
  private readonly apiKey = process.env.AFTERSHIP_API_KEY;

  private readonly client = axios.create({
    baseURL: AFTERSHIP_BASE_URL,
    timeout: 10000,
    headers: {
      "as-api-key": process.env.AFTERSHIP_API_KEY || "",
      "Content-Type": "application/json",
    },
  });

  isEnabled() {
    return Boolean(this.apiKey);
  }

  private mapStatus(tag?: string | null) {
    const normalized = normalizeText(tag);

    switch (normalized) {
      case "delivered":
        return TRANSACTION_STATUS.DELIVERED;
      case "intransit":
      case "in-transit":
      case "out-for-delivery":
      case "available-for-pickup":
        return TRANSACTION_STATUS.IN_TRANSIT;
      case "shipped":
      case "pickup":
      case "picked-up":
        return TRANSACTION_STATUS.SHIPPED;
      case "pending":
      case "info-received":
      case "not-found":
      case "expired":
        return TRANSACTION_STATUS.PENDING;
      case "attempt-failed":
      case "exception":
      case "failed-attempt":
        return TRANSACTION_STATUS.PROCESSING;
      default:
        return TRANSACTION_STATUS.PROCESSING;
    }
  }

  private buildLocation(payload: any) {
    const parts = [
      payload?.location,
      payload?.city,
      payload?.state,
      payload?.country_name,
      payload?.country_iso3,
      payload?.zip,
    ]
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);

    return parts.length ? Array.from(new Set(parts)).join(", ") : null;
  }

  private buildCheckpoint(payload: any, fallbackCarrier?: string | null) {
    const occurredAt =
      toDate(
        payload?.checkpoint_time ||
          payload?.created_at ||
          payload?.updated_at ||
          payload?.time
      ) || new Date();
    const status = this.mapStatus(
      payload?.tag || payload?.checkpoint_tag || payload?.subtag
    );
    const title =
      payload?.tag_name ||
      payload?.title ||
      payload?.subtag_message ||
      payload?.message ||
      "Carrier update";
    const description =
      payload?.message ||
      payload?.description ||
      payload?.subtag_message ||
      "The carrier posted a new tracking update.";

    return {
      occurredAt,
      status,
      title,
      description,
      location: this.buildLocation(payload),
      carrier:
        payload?.courier_name ||
        payload?.slug ||
        payload?.carrier ||
        fallbackCarrier ||
        null,
      trackingNumber:
        payload?.tracking_number || payload?.trackingNumber || null,
    } satisfies LiveTrackingCheckpoint;
  }

  private extractTrackingRecord(payload: any) {
    const trackingList = readNested<any[]>(payload, [
      ["data", "trackings"],
      ["trackings"],
      ["data", "tracking"],
    ]);

    if (Array.isArray(trackingList)) {
      return trackingList[0] || null;
    }

    if (trackingList && !Array.isArray(trackingList)) {
      return trackingList;
    }

    return readNested<any>(payload, [["data", "tracking"], ["tracking"]]) || null;
  }

  private async detectCourier(trackingNumber: string) {
    try {
      const response = await this.client.post("/couriers/detect", {
        tracking_number: trackingNumber,
      });
      const couriers = readNested<any[]>(response.data, [
        ["data", "couriers"],
        ["couriers"],
      ]);
      const firstCourier = Array.isArray(couriers) ? couriers[0] : null;

      return {
        slug: firstCourier?.slug || null,
        name: firstCourier?.name || null,
      } satisfies DetectCourierResult;
    } catch (error) {
      return {
        slug: null,
        name: null,
      } satisfies DetectCourierResult;
    }
  }

  private async ensureTrackingRegistered({
    orderId,
    trackingNumber,
    carrier,
  }: SyncTrackingInput) {
    const detectedCourier = await this.detectCourier(trackingNumber);
    const slug = normalizeText(carrier) || detectedCourier.slug || undefined;

    try {
      await this.client.post("/trackings", {
        tracking_number: trackingNumber,
        slug,
        title: `Order ${orderId}`,
        order_id: orderId,
      });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status;

      if (status && [400, 409, 422].includes(status)) {
        return {
          slug,
          name: detectedCourier.name || carrier || slug || null,
        } satisfies DetectCourierResult;
      }

      throw error;
    }

    return {
      slug,
      name: detectedCourier.name || carrier || slug || null,
    } satisfies DetectCourierResult;
  }

  async fetchTracking(input: SyncTrackingInput): Promise<LiveTrackingSnapshot | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const registeredCourier = await this.ensureTrackingRegistered(input);

    try {
      const response = await this.client.get("/trackings", {
        params: {
          tracking_numbers: input.trackingNumber,
          ...(registeredCourier.slug ? { slug: registeredCourier.slug } : {}),
          limit: 1,
        },
      });
      const tracking = this.extractTrackingRecord(response.data);

      if (!tracking) {
        return null;
      }

      const checkpoints = (
        readNested<any[]>(tracking, [["checkpoints"]]) || []
      )
        .map((checkpoint) =>
          this.buildCheckpoint(
            {
              ...checkpoint,
              tracking_number: tracking?.tracking_number || input.trackingNumber,
            },
            tracking?.courier_name || registeredCourier.name || input.carrier
          )
        )
        .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());

      const latestCheckpoint = checkpoints[checkpoints.length - 1] || null;
      const currentStatus = this.mapStatus(
        tracking?.tag || latestCheckpoint?.status || null
      );

      return {
        provider: "aftership",
        trackingNumber: tracking?.tracking_number || input.trackingNumber,
        carrierSlug:
          tracking?.slug || registeredCourier.slug || normalizeText(input.carrier),
        carrierName:
          tracking?.courier_name ||
          registeredCourier.name ||
          input.carrier ||
          null,
        currentStatus,
        currentLocation:
          latestCheckpoint?.location || this.buildLocation(tracking) || null,
        estimatedDeliveryDate:
          toDate(tracking?.expected_delivery) ||
          toDate(tracking?.delivery_time) ||
          null,
        courierTrackingLink:
          tracking?.courier_tracking_link || tracking?.tracking_link || null,
        lastUpdatedAt:
          latestCheckpoint?.occurredAt ||
          toDate(tracking?.updated_at) ||
          toDate(tracking?.created_at) ||
          null,
        checkpoints,
        raw: tracking,
      } satisfies LiveTrackingSnapshot;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const responseMessage =
        axiosError.response?.data?.meta?.message ||
        axiosError.response?.data?.message ||
        axiosError.message;

      throw new AppError(
        axiosError.response?.status || 502,
        `AfterShip tracking sync failed: ${responseMessage}`
      );
    }
  }
}
