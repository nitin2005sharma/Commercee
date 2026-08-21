"use client";

import React from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Truck } from "lucide-react";
import {
  getOrderTrackingColor,
  getOrderTrackingIcon,
  getOrderTrackingLabel,
  getOrderTrackingProgressSequence,
  getOrderTrackingStep,
} from "@/app/utils/orderTracking";

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Pending";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TrackingMetaCard = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
    <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-gray-900">
      {value || "Not available yet"}
    </p>
  </div>
);

const OrderStatus = ({ order }) => {
  const tracking = order?.tracking;
  const currentStatus =
    tracking?.currentStatus || order?.transaction?.status || order?.status;
  const progressStatuses = getOrderTrackingProgressSequence(currentStatus);
  const currentStep = getOrderTrackingStep(currentStatus);
  const currentIcon = getOrderTrackingIcon(currentStatus);
  const CurrentIcon = currentIcon;
  const trackingEvents = tracking?.events || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm"
    >
      <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${getOrderTrackingColor(
                currentStatus
              )}`}
            >
              <CurrentIcon size={16} />
              <span>{getOrderTrackingLabel(currentStatus)}</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {tracking?.headline || "Tracking your order"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                {tracking?.summary ||
                  "Progress updates will appear here as the order moves through fulfillment and delivery."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600">
              Last update
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDateTime(tracking?.lastUpdatedAt || order?.updatedAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TrackingMetaCard
            label="Current location"
            value={tracking?.currentLocation}
          />
          <TrackingMetaCard label="Carrier" value={tracking?.carrier} />
          <TrackingMetaCard
            label="Tracking number"
            value={tracking?.trackingNumber}
          />
          <TrackingMetaCard
            label="Expected delivery"
            value={formatDateTime(tracking?.estimatedDeliveryDate)}
          />
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="relative mb-8">
          <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-gray-200" />
          <div
            className="absolute left-0 top-5 h-1 rounded-full bg-blue-500 transition-all duration-500"
            style={{
              width: `${
                ((currentStep - 1) / Math.max(progressStatuses.length - 1, 1)) *
                100
              }%`,
            }}
          />

          <div
            className="relative grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${progressStatuses.length}, minmax(0, 1fr))`,
            }}
          >
            {progressStatuses.map((status, index) => {
              const StepIcon = getOrderTrackingIcon(status);
              const isComplete = currentStep >= index + 1;

              return (
                <div
                  key={status}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border ${
                      isComplete
                        ? "border-blue-200 bg-blue-50 text-blue-600"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    <StepIcon size={18} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {getOrderTrackingLabel(status)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-gray-50/70 p-5">
          <div className="flex items-center gap-2">
            <Truck className="text-blue-600" size={18} />
            <h3 className="text-lg font-semibold text-gray-900">
              Tracking timeline
            </h3>
          </div>

          <div className="mt-5 space-y-4">
            {trackingEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                Tracking events will appear here once the order starts moving.
              </div>
            ) : (
              trackingEvents.map((event, index) => {
                const EventIcon = getOrderTrackingIcon(event.status);
                const isLatest = index === trackingEvents.length - 1;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {index !== trackingEvents.length - 1 ? (
                      <div className="absolute left-[19px] top-11 h-[calc(100%-1rem)] w-px bg-gray-200" />
                    ) : null}

                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                        isLatest
                          ? "border-blue-200 bg-blue-50 text-blue-600"
                          : "border-gray-200 bg-white text-gray-500"
                      }`}
                    >
                      <EventIcon size={18} />
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {event.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-gray-600">
                            {event.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
                          <CalendarDays size={14} />
                          <span>{formatDateTime(event.occurredAt)}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                        {event.location ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                            <MapPin size={14} />
                            {event.location}
                          </span>
                        ) : null}

                        {event.carrier ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                            <Truck size={14} />
                            {event.carrier}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderStatus;
