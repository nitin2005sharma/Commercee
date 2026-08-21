import SupportPage from "@/app/components/templates/SupportPage";
import { RETURNS_GUIDANCE, SUPPORT_HOURS } from "@/app/lib/constants/support";

export default function ReturnsPage() {
  return (
    <SupportPage
      badge="Returns"
      title="Returns & Exchanges"
      description="This page explains how returns and exchanges should work in the application, including what customers should prepare before contacting support and how delivery details connect to the return flow."
      sections={[
        {
          title: "Before You Request a Return",
          points: [
            "Customers should request returns within 7 to 14 days of delivery.",
            ...RETURNS_GUIDANCE,
            "Track Order shows the delivery address, shipment progress, and status history tied to the order.",
          ],
        },
        {
          title: "What Happens Next",
          points: [
            "Exchanges depend on replacement stock being available.",
            "If a direct exchange is not possible, support can guide the customer into a refund and replacement purchase flow.",
            "Returned, refunded, and delivered states can all appear in the same order tracking timeline.",
            `Support reviews are expected during ${SUPPORT_HOURS}.`,
          ],
        },
      ]}
      primaryCta={{ href: "/track-order", label: "Track My Order" }}
      secondaryCta={{ href: "/support", label: "Contact Support" }}
    />
  );
}
