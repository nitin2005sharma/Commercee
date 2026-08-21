import {
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  RotateCcw,
  ShoppingBag,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export const TRACKING_PROGRESS_SEQUENCE = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
];

export const TRACKING_TERMINAL_STATUSES = [
  "CANCELED",
  "RETURNED",
  "REFUNDED",
];

export const getOrderTrackingLabel = (status?: string) => {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    CANCELED: "Canceled",
    RETURNED: "Returned",
    REFUNDED: "Refunded",
  };

  return labels[status || ""] || "Pending";
};

export const getOrderTrackingColor = (status?: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
    SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
    IN_TRANSIT: "bg-violet-100 text-violet-800 border-violet-200",
    DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELED: "bg-rose-100 text-rose-800 border-rose-200",
    RETURNED: "bg-orange-100 text-orange-800 border-orange-200",
    REFUNDED: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return colors[status || ""] || colors.PENDING;
};

export const getOrderTrackingIcon = (status?: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    PENDING: Clock,
    PROCESSING: Package,
    SHIPPED: Truck,
    IN_TRANSIT: Truck,
    DELIVERED: CheckCircle,
    CANCELED: XCircle,
    RETURNED: RotateCcw,
    REFUNDED: DollarSign,
  };

  return icons[status || ""] || ShoppingBag;
};

export const getOrderTrackingProgressSequence = (status?: string) => {
  if (status && TRACKING_TERMINAL_STATUSES.includes(status)) {
    return ["PENDING", status];
  }

  return TRACKING_PROGRESS_SEQUENCE;
};

export const getOrderTrackingStep = (status?: string) => {
  const sequence = getOrderTrackingProgressSequence(status);
  const index = sequence.indexOf(status || "PENDING");
  return index >= 0 ? index + 1 : 1;
};
