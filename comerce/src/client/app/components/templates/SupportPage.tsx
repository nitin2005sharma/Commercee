import Link from "next/link";
import MainLayout from "./MainLayout";

interface SupportSection {
  title: string;
  points: string[];
}

interface SupportPageProps {
  badge: string;
  title: string;
  description: string;
  sections: SupportSection[];
  primaryCta: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
}

export default function SupportPage({
  badge,
  title,
  description,
  sections,
  primaryCta,
  secondaryCta,
}: SupportPageProps) {
  return (
    <MainLayout>
      <div className="py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-8 shadow-sm sm:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
              {badge}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {description}
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {sections.map((section) => (
                <section
                  key={section.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-slate-900">
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {section.points.map((point) => (
                      <p key={point}>{point}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                {primaryCta.label}
              </Link>
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
