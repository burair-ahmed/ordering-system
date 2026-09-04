/**
 * slugify.ts — URL slug utilities for Cafe Little Karachi clean URL architecture.
 *
 * Creates clean, URL-safe slugs from menu item/platter titles and provides
 * catalog lookup helpers for resolving slugs back to item data.
 */

/**
 * Converts a product title to a URL-safe slug.
 *
 * Examples:
 *   "Special Chicken Karahi (Half)"  → "special-chicken-karahi-half"
 *   "Beef Seekh Kebab & Naan"        → "beef-seekh-kebab-naan"
 *   "Family Feast Platter #1"        → "family-feast-platter-1"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")   // remove special chars except spaces and hyphens
    .trim()
    .replace(/[\s]+/g, "-")          // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
}

/**
 * Finds an item from a list by matching its slug against the item's title slug,
 * or falls back to matching by raw database _id / id field.
 */
export function findItemBySlug<T extends { title: string; id?: string | number; _id?: string }>(
  items: T[],
  slugOrId: string
): T | undefined {
  const normalized = slugOrId.toLowerCase();

  // 1. Try slug match on title
  const bySlug = items.find((item) => slugify(item.title) === normalized);
  if (bySlug) return bySlug;

  // 2. Fallback: match by id or _id
  return items.find(
    (item) =>
      String(item.id) === normalized ||
      String(item._id) === normalized
  );
}

/**
 * Finds a platter by slug or id from a list of platter objects.
 * Platters have a `title` field like menu items.
 */
export function findPlatterBySlug<
  T extends { title: string; id?: string; _id?: string }
>(items: T[], slugOrId: string): T | undefined {
  return findItemBySlug(items, slugOrId);
}
