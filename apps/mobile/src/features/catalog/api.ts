import type { Tables } from "@devispro/shared";
import { supabase } from "@/lib/supabase";

export type CatalogItem = Tables<"catalog_items">;

export async function listActiveCatalogItems(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("active", true)
    .order("label");
  if (error) throw error;
  return data;
}