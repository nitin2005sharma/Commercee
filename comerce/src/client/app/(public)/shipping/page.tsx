import SupportPage from "@/app/components/templates/SupportPage";
import { SHIPPING_GUIDANCE, SUPPORT_HOURS } from "@/app/lib/constants/support";

export default function ShippingInfoPage() {
  return (
    <SupportPage
      badge="Shipping"
      title="Shipping Information"
      description="This page explains how dispatch, delivery timing, and tracking work in the application, including how customers can confirm their delivery address and live shipment progress."
      sections={[
        {
          title: "Processing & Dispatch",
          points: [
            "Orders begin processing after payment is confirmed and stock is validated.",
            "Dispatch updates move through statuses like Processing, Shipped, and In Transit.",
            ...SHIPPING_GUIDANCE,
          ],
        },
        {
          title: "Address & Delivery Support",
          points: [
            "Use Track Order to confirm the current delivery address, carrier, and tracking number attached to your order.",
            "If an address needs correction after checkout, contact support as early as possible before the shipment is delivered.",
            `Support hours: ${SUPPORT_HOURS}.`,
          ],
        },
      ]}
      primaryCta={{ href: "/track-order", label: "Track an Order" }}
      secondaryCta={{ href: "/support", label: "Contact Support" }}
    />
  );
}
