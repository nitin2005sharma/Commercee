import {
  ORDER_TRACKING_EVENT_SOURCE,
  TRANSACTION_STATUS,
} from "@prisma/client";

export const TRACKING_PROGRESS_SEQUENCE: TRANSACTION_STATUS[] = [
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.PROCESSING,
  TRANSACTION_STATUS.SHIPPED,
  TRANSACTION_STATUS.IN_TRANSIT,
  TRANSACTION_STATUS.DELIVERED,
];

export const TRACKING_TERMINAL_STATUSES: TRANSACTION_STATUS[] = [
  TRANSACTION_STATUS.CANCELED,
  TRANSACTION_STATUS.RETURNED,
  TRANSACTION_STATUS.REFUNDED,
];

const STATUS_LABELS: Record<TRANSACTION_STATUS, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

const STATUS_TITLES: Record<TRANSACTION_STATUS, string> = {
  PENDING: "Order placed",
  PROCESSING: "Preparing your order",
  SHIPPED: "Package shipped",
  IN_TRANSIT: "Package in transit",
  DELIVERED: "Package delivered",
  CANCELED: "Order canceled",
  RETURNED: "Return in progress",
  REFUNDED: "Refund completed",
};

const STATUS_DESCRIPTIONS: Record<TRANSACTION_STATUS, string> = {
  PENDING: "We received your order and queued it for fulfillment.",
  PROCESSING: "Your items are being packed and prepared for dispatch.",
  SHIPPED: "The parcel has been handed to the carrier.",
  IN_TRANSIT: "The parcel is moving through the delivery network.",
  DELIVERED: "The parcel has reached its destination.",
  CANCELED: "This order was canceled before completion.",
  RETURNED: "The order is being returned back through the carrier network.",
  REFUNDED: "A refund has been issued for this order.",
};

const STATUS_HEADLINES: Record<TRANSACTION_STATUS, string> = {
  PENDING: "Order received",
  PROCESSING: "We're preparing your order",
  SHIPPED: "Your order has left our facility",
  IN_TRANSIT: "Your order is on the way",
  DELIVERED: "Your order has arrived",
  CANCELED: "This order was canceled",
  RETURNED: "This order is being returned",
  REFUNDED: "Your refund has been completed",
};

type TrackingEventInput = {
  status: TRANSACTION_STATUS;
  title?: string;
  description?: string | null;
  location?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  source?: ORDER_TRACKING_EVENT_SOURCE;
  occurredAt?: Date;
};

const trimOrNull = (value?: string | null) => value?.trim() || null;

const sortTrackingEvents = <T extends Record<string, any>>(events: T[]) =>
  [...events].sort(
    (left, right) =>
      new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()
  );

export function getTrackingStatusLabel(status?: string | null) {
  if (!status || !(status in STATUS_LABELS)) {
    return STATUS_LABELS[TRANSACTION_STATUS.PENDING];
  }

  return STATUS_LABELS[status as TRANSACTION_STATUS];
}

export function getEffectiveTrackingStatus(order: any) {
  const rawStatus = order?.transaction?.status || order?.status;

  if (rawStatus && Object.values(TRANSACTION_STATUS).includes(rawStatus)) {
    return rawStatus as TRANSACTION_STATUS;
  }

  return TRANSACTION_STATUS.PENDING;
}

export function buildOrderTrackingEventData({
  status,
  title,
  description,
  location,
  carrier,
  trackingNumber,
  source = ORDER_TRACKING_EVENT_SOURCE.SYSTEM,
  occurredAt = new Date(),
}: TrackingEventInput) {
  const normalizedLocation = trimOrNull(location);
  const normalizedCarrier = trimOrNull(carrier);
  const normalizedTrackingNumber = trimOrNull(trackingNumber);
  const normalizedDescription = trimOrNull(description);

  return {
    status,
    title: trimOrNull(title) || STATUS_TITLES[status],
    description:
      normalizedDescription ||
      (normalizedLocation
        ? `${STATUS_DESCRIPTIONS[status]} Current location: ${normalizedLocation}.`
        : STATUS_DESCRIPTIONS[status]),
    location: normalizedLocation,
    carrier: normalizedCarrier,
    trackingNumber: normalizedTrackingNumber,
    source,
    occurredAt,
  };
}

export function buildFallbackTrackingEvents(order: any) {
  const currentStatus = getEffectiveTrackingStatus(order);
  const transactionDate =
    order?.transaction?.transactionDate ||
    order?.transaction?.createdAt ||
    order?.createdAt ||
    order?.orderDate;
  const events = [
    {
      ...buildOrderTrackingEventData({
        status: TRANSACTION_STATUS.PENDING,
        carrier: order?.shipment?.carrier,
        trackingNumber: order?.shipment?.trackingNumber,
        occurredAt: new Date(order?.orderDate || order?.createdAt || Date.now()),
      }),
      id: `fallback-${order?.id || "order"}-pending`,
    },
  ];

  if (currentStatus !== TRANSACTION_STATUS.PENDING) {
    events.push({
      ...buildOrderTrackingEventData({
        status: TRANSACTION_STATUS.PROCESSING,
        carrier: order?.shipment?.carrier,
        trackingNumber: order?.shipment?.trackingNumber,
        occurredAt: new Date(transactionDate || Date.now()),
      }),
      id: `fallback-${order?.id || "order"}-processing`,
    });
  }

  if (
    (
      [
        TRANSACTION_STATUS.SHIPPED,
        TRANSACTION_STATUS.IN_TRANSIT,
        TRANSACTION_STATUS.DELIVERED,
      ] as TRANSACTION_STATUS[]
    ).includes(currentStatus)
  ) {
    events.push({
      ...buildOrderTrackingEventData({
        status: TRANSACTION_STATUS.SHIPPED,
        carrier: order?.shipment?.carrier,
        trackingNumber: order?.shipment?.trackingNumber,
        occurredAt: new Date(
          order?.shipment?.shippedDate || order?.transaction?.updatedAt || Date.now()
        ),
      }),
      id: `fallback-${order?.id || "order"}-shipped`,
    });
  }

  if (
    (
      [TRANSACTION_STATUS.IN_TRANSIT, TRANSACTION_STATUS.DELIVERED] as
        TRANSACTION_STATUS[]
    ).includes(currentStatus)
  ) {
    events.push({
      ...buildOrderTrackingEventData({
        status: TRANSACTION_STATUS.IN_TRANSIT,
        carrier: order?.shipment?.carrier,
        trackingNumber: order?.shipment?.trackingNumber,
        occurredAt: new Date(order?.transaction?.updatedAt || Date.now()),
      }),
      id: `fallback-${order?.id || "order"}-in-transit`,
    });
  }

  if (currentStatus === TRANSACTION_STATUS.DELIVERED) {
    events.push({
      ...buildOrderTrackingEventData({
        status: TRANSACTION_STATUS.DELIVERED,
        carrier: order?.shipment?.carrier,
        trackingNumber: order?.shipment?.trackingNumber,
        occurredAt: new Date(
          order?.shipment?.deliveryDate || order?.transaction?.updatedAt || Date.now()
        ),
      }),
      id: `fallback-${order?.id || "order"}-delivered`,
    });
  }

  if (TRACKING_TERMINAL_STATUSES.includes(currentStatus)) {
    events.push({
      ...buildOrderTrackingEventData({
        status: currentStatus,
        carrier: order?.shipment?.carrier,
        trackingNumber: order?.shipment?.trackingNumber,
        occurredAt: new Date(order?.transaction?.updatedAt || order?.updatedAt || Date.now()),
      }),
      id: `fallback-${order?.id || "order"}-${currentStatus.toLowerCase()}`,
    });
  }

  const seen = new Set<string>();

  return sortTrackingEvents(events).filter((event) => {
    const key = `${event.status}:${new Date(event.occurredAt).toISOString()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildOrderTrackingResponse(order: any) {
  const currentStatus = getEffectiveTrackingStatus(order);
  const liveTrackingMeta = order?.liveTrackingMeta || null;
  const explicitEvents = Array.isArray(order?.trackingEvents)
    ? sortTrackingEvents(order.trackingEvents)
    : [];
  const normalizedEvents =
    explicitEvents.length > 0 ? explicitEvents : buildFallbackTrackingEvents(order);
  const latestEvent = normalizedEvents[normalizedEvents.length - 1] || null;

  return {
    currentStatus,
    currentLabel: getTrackingStatusLabel(currentStatus),
    headline: STATUS_HEADLINES[currentStatus],
    summary: latestEvent?.description || STATUS_DESCRIPTIONS[currentStatus],
    currentLocation: latestEvent?.location || null,
    carrier:
      order?.shipment?.carrier ||
      liveTrackingMeta?.carrierName ||
      latestEvent?.carrier ||
      null,
    trackingNumber:
      order?.shipment?.trackingNumber || latestEvent?.trackingNumber || null,
    estimatedDeliveryDate: order?.shipment?.deliveryDate || null,
    lastUpdatedAt:
      latestEvent?.occurredAt || order?.updatedAt || order?.createdAt || null,
    events: normalizedEvents.map((event: any) => ({
      id: event.id,
      status: event.status,
      label: getTrackingStatusLabel(event.status),
      title: event.title,
      description: event.description,
      location: event.location,
      carrier: event.carrier,
      trackingNumber: event.trackingNumber,
        source: event.source,
        occurredAt: event.occurredAt,
    })),
    live: liveTrackingMeta
      ? {
          provider: liveTrackingMeta.provider || null,
          carrierSlug: liveTrackingMeta.carrierSlug || null,
          carrierName: liveTrackingMeta.carrierName || null,
          courierTrackingLink: liveTrackingMeta.courierTrackingLink || null,
          syncedAt: liveTrackingMeta.syncedAt || null,
          liveEnabled: Boolean(liveTrackingMeta.liveEnabled),
        }
      : null,
  };
}

export function shouldHaveShipmentRecord(status: TRANSACTION_STATUS) {
  return (
    (
      [
        TRANSACTION_STATUS.SHIPPED,
        TRANSACTION_STATUS.IN_TRANSIT,
        TRANSACTION_STATUS.DELIVERED,
      ] as TRANSACTION_STATUS[]
    ).includes(status)
  );
}
