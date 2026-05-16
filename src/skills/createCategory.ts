import { db } from "@/lib/db";

export type CategoryResult =
  | { ok: true; name: string; created: boolean }
  | { ok: false; error: string };

export async function getCategories(): Promise<string[]> {
  const rows = await db.category.findMany({ orderBy: { name: "asc" } });
  return rows.map((r) => r.name);
}

export async function ensureCategory(name: string): Promise<CategoryResult> {
  const normalized = name.toLowerCase().trim();
  if (!normalized) return { ok: false, error: "Category name is empty" };

  try {
    const existing = await db.category.findUnique({ where: { name: normalized } });
    if (existing) return { ok: true, name: normalized, created: false };

    await db.category.create({ data: { name: normalized } });
    return { ok: true, name: normalized, created: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
