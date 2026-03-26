export type CatalogPlanCode = "free" | "pro" | "premium";

export type PlanCatalogItem = {
  code: CatalogPlanCode;
  name: string;
  tagline: string;
  description: string;
  ctaLabel: string;
  limitSummary: {
    practice: string;
    paper: string;
    exports: string;
    generations: string;
    swaps: string;
    devices: string;
    branding: string;
  };
  highlights: string[];
};

export const PLAN_CATALOG: readonly PlanCatalogItem[] = [
  {
    code: "free",
    name: "Free",
    tagline: "Preview-first study flow",
    description:
      "Use free-preview chapters, practice in smaller batches, and export a modest number of papers each month.",
    ctaLabel: "Current entry plan",
    limitSummary: {
      practice: "12 questions",
      paper: "12 questions",
      exports: "5 / month",
      generations: "10 / month",
      swaps: "10 / month",
      devices: "1 device",
      branding: "No saved logos",
    },
    highlights: [
      "Free-preview chapters and lessons only",
      "Mini blueprint and quick paper tools included",
      "Best for trying the workflow before upgrading",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    tagline: "Teacher workflow with higher limits",
    description:
      "Move from preview mode to full published access with room for regular teaching, printing, and revisions.",
    ctaLabel: "Request Pro",
    limitSummary: {
      practice: "40 questions",
      paper: "40 questions",
      exports: "60 / month",
      generations: "120 / month",
      swaps: "120 / month",
      devices: "2 devices",
      branding: "2 saved logos",
    },
    highlights: [
      "Full published static question access",
      "Enough monthly capacity for day-to-day teaching",
      "Branding and multi-device use unlocked",
    ],
  },
  {
    code: "premium",
    name: "Premium",
    tagline: "High-volume protected workflow",
    description:
      "Designed for heavier exam operations with generous limits and stronger protection features for managed printing.",
    ctaLabel: "Request Premium",
    limitSummary: {
      practice: "120 questions",
      paper: "120 questions",
      exports: "240 / month",
      generations: "400 / month",
      swaps: "400 / month",
      devices: "3 devices",
      branding: "2 saved logos",
    },
    highlights: [
      "Higher-volume paper generation and export",
      "Offline DRM and screenshot blocking enabled",
      "Best fit for coordinated exam preparation teams",
    ],
  },
] as const;

export const getPlanCatalogItem = (code: CatalogPlanCode) =>
  PLAN_CATALOG.find((item) => item.code === code) ?? PLAN_CATALOG[0];
