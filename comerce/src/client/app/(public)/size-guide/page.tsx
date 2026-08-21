import SupportPage from "@/app/components/templates/SupportPage";

export default function SizeGuidePage() {
  return (
    <SupportPage
      badge="Sizing"
      title="Size Guide"
      description="This placeholder size guide gives the project a working customer-facing route until you replace it with real product-specific measurements."
      sections={[
        {
          title: "How to Measure",
          points: [
            "Measure the chest, waist, and hips with a soft measuring tape.",
            "Compare your measurements to the size chart on each product page.",
            "When between sizes, choose the larger size for a looser fit.",
          ],
        },
        {
          title: "Fit Tips",
          points: [
            "Different brands and categories may fit differently.",
            "Product descriptions should mention slim, regular, or relaxed fit.",
            "If sizing is unclear, support can help before the order is placed.",
          ],
        },
      ]}
      primaryCta={{ href: "/shop", label: "Browse Products" }}
      secondaryCta={{ href: "/support", label: "Ask Support" }}
    />
  );
}
