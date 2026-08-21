"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import MainLayout from "@/app/components/templates/MainLayout";
import { useLookupOrderTrackingMutation } from "@/app/store/apis/OrderApi";
import {
  getOrderTrackingColor,
  getOrderTrackingIcon,
  getOrderTrackingLabel,
} from "@/app/utils/orderTracking";
import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  MapPin,
  Package,
  Search,
  Truck,
} from "lucide-react";

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

const formatPrice = (amount?: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [lookupOrderTracking, { isLoading }] = useLookupOrderTrackingMutation();
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentStatus = trackedOrder?.tracking?.currentStatus || trackedOrder?.status;
  const CurrentStatusIcon = getOrderTrackingIcon(currentStatus);

  const addressLines = useMemo(() => {
    if (!trackedOrder?.address) {
      return [];
    }

    const { street, city, state, country, zip } = trackedOrder.address;
    return [street, [city, state].filter(Boolean).join(", "), [country, zip].filter(Boolean).join(" ")].filter(Boolean);
  }, [trackedOrder]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      const response = await lookupOrderTracking({
        orderId: orderId.trim(),
        email: email.trim(),
      }).unwrap();
      setTrackedOrder(response.order);
    } catch (error: any) {
      setTrackedOrder(null);
      setErrorMessage(
        error?.data?.message ||
          "We could not find an order with that order ID and email."
      );
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-8 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
              Order Tracking
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              Find your order with live progress and delivery details
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Enter the same email used during checkout and your order ID to see
              the latest status, tracking timeline, delivery address, and item
              summary.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm lg:grid-cols-[1.2fr_1fr_auto]"
          >
            <div>
              <label className="text-sm font-medium text-slate-700">
                Order ID
              </label>
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Ex: cs_test_abc123 or your UUID order id"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 lg:self-end"
            >
              <Search size={16} />
              {isLoading ? "Checking..." : "Track order"}
            </button>
          </form>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        {trackedOrder ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${getOrderTrackingColor(
                        currentStatus
                      )}`}
                    >
                      <CurrentStatusIcon size={16} />
                      {getOrderTrackingLabel(currentStatus)}
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-slate-900">
                      {trackedOrder.tracking?.headline || "Order in progress"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {trackedOrder.tracking?.summary}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Last update
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDateTime(trackedOrder.tracking?.lastUpdatedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Order ID
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {trackedOrder.id}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Carrier
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {trackedOrder.tracking?.carrier || "Not assigned yet"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Tracking number
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {trackedOrder.tracking?.trackingNumber || "Pending"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Current location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {trackedOrder.tracking?.currentLocation || "Awaiting update"}
                    </p>
                  </div>
                </div>

                {trackedOrder.tracking?.live?.liveEnabled ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">
                          Live courier sync
                          {trackedOrder.tracking.live.provider
                            ? ` via ${trackedOrder.tracking.live.provider}`
                            : ""}
                        </p>
                        <p className="mt-1 text-emerald-800/80">
                          Latest carrier sync{" "}
                          {trackedOrder.tracking.live.syncedAt
                            ? new Date(
                                trackedOrder.tracking.live.syncedAt
                              ).toLocaleString()
                            : "is enabled"}
                          .
                        </p>
                      </div>

                      {trackedOrder.tracking.live.courierTrackingLink ? (
                        <a
                          href={trackedOrder.tracking.live.courierTrackingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Open carrier page
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Tracking timeline
                  </h3>
                </div>

                <div className="mt-5 space-y-4">
                  {(trackedOrder.tracking?.events || []).map((event, index, events) => {
                    const EventIcon = getOrderTrackingIcon(event.status);
                    const isLatest = index === events.length - 1;

                    return (
                      <div key={event.id} className="relative flex gap-4">
                        {index !== events.length - 1 ? (
                          <div className="absolute left-[19px] top-11 h-[calc(100%-1rem)] w-px bg-slate-200" />
                        ) : null}
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                            isLatest
                              ? "border-blue-200 bg-blue-50 text-blue-600"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          <EventIcon size={18} />
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {event.title}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {event.description}
                              </p>
                            </div>
                            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                              <CalendarDays size={14} />
                              {formatDateTime(event.occurredAt)}
                            </div>
                          </div>

                          {event.location ? (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700">
                              <MapPin size={14} />
                              {event.location}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Delivery address
                </h3>
                {addressLines.length ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {addressLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No delivery address is attached to this order yet.
                  </p>
                )}
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Order summary
                </h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Placed on</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(trackedOrder.orderDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total amount</span>
                    <span className="font-medium text-slate-900">
                      {formatPrice(trackedOrder.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Expected delivery</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(trackedOrder.tracking?.estimatedDeliveryDate)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Items in this order
                  </h3>
                </div>
                <div className="mt-4 space-y-3">
                  {(trackedOrder.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                            {item.sku || "SKU pending"}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          x{item.quantity}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                        <span>{item.categoryName || "General item"}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
                <h3 className="text-lg font-semibold">Need help with this order?</h3>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  If the address is wrong, the package is delayed, or you want a
                  return after delivery, open a support conversation with this
                  order ID ready.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/support"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Open support
                    <ChevronRight size={16} />
                  </Link>
                  <Link
                    href="/returns"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    View returns policy
                  </Link>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Live progress",
                description:
                  "See whether the order is processing, shipped, in transit, or delivered.",
              },
              {
                title: "Delivery address",
                description:
                  "Verify the address attached to the shipment before opening a support request.",
              },
              {
                title: "Tracking details",
                description:
                  "Get the latest carrier, tracking number, and milestone timeline in one place.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default TrackOrderPage;
