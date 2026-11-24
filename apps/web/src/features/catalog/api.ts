import type { Tables, TablesInsert, TablesUpdate } from "@devispro/shared";
import { supabase } from "@/lib/supabase";

export type CatalogItem = Tables<"catalog_items">;
export type CatalogItemInput = Pick<
  TablesInsert<"catalog_items">,
  "label" | "unit" | "unit_price_cents" | "vat_rate"
>;

// Pas de filtre company_id : la RLS ne renvoie que l'entreprise connectée.
export async function listCatalogItems(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("*")
    .order("active", { ascending: false })
    .order("label");
  if (error) throw error;
  return data;
}

export async function createCatalogItem(input: CatalogItemInput): Promise<void> {
  const { error } = await supabase.from("catalog_items").insert(input);
  if (error) throw error;
}

export async function updateCatalogItem(
  id: string,
  patch: TablesUpdate<"catalog_items">,
): Promise<void> {
  const { error } = await supabase.from("catalog_items").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const { error } = await supabase.from("catalog_items").delete().eq("id", id);
  if (error) throw error;
}