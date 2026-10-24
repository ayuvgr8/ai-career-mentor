import type { CareerRole } from "@workspace/db/schema";

// Keep archived draft packs in the database, but do not publish them at launch.
export const launchSlugs = new Set([
  "front-end-engineer",
  "performance-marketing",
  "product-design",
  "core-product-manager",
]);
const families = [
  [
    "software-engineer",
    "Software Engineer",
    [
      ["front-end-engineer", "Front-end Engineer"],
      ["back-end-engineer", "Back-end Engineer"],
      ["data-engineer", "Data Engineer"],
    ],
  ],
  [
    "marketing",
    "Marketing",
    [
      ["performance-marketing", "Performance Marketer"],
      ["brand-marketing", "Brand Marketer"],
    ],
  ],
  [
    "content-design",
    "Content Creation / Design",
    [
      ["content-creator", "Content Creator"],
      ["product-design", "Product Designer"],
      ["ad-creative", "Ad Creative"],
    ],
  ],
  [
    "product-manager",
    "Product Manager",
    [
      ["core-product-manager", "Core Product Manager"],
      ["ai-product-manager", "AI Product Manager"],
      ["product-builder", "Product Builder"],
    ],
  ],
] as const;

export function launchCatalog(stored: CareerRole[]): CareerRole[] {
  return families.flatMap(([familySlug, familyTitle, roles], familyIndex) =>
    roles.map(([slug, title], index) => {
      const available = stored.find(
        (role) =>
          role.slug === slug &&
          launchSlugs.has(slug) &&
          role.status === "approved",
      );
      if (available) return available;
      return {
        slug,
        title,
        familySlug,
        familyTitle,
        status: "coming",
        content: null,
        summary:
          slug === "brand-marketing"
            ? "Brand strategy, go-to-market, and content. Guide coming soon."
            : "This role guide is coming soon.",
        sortOrder: familyIndex * 100 + index,
        updatedAt: new Date(0),
      };
    }),
  );
}
