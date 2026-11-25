import type { QuoteStatus } from "@devispro/shared";
import { supabase } from "@/lib/supabase";

// ---------- Liste ----------
export async function listQuotes() {
  const { data, error } = await supabase
    .from("quotes")
    .select("id, status, notes, created_at, total_ttc_cents, clients(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type QuoteListItem = Awaited<ReturnType<typeof listQuotes>>[number];

// ---------- Création ----------
export async function createDraftQuote(): Promise<string> {
  const { data, error } = await supabase.from("quotes").insert({}).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
}

export type SaveQuoteLine = {
  catalog_item_id: string | null;
  label: string;
  unit: string;
  quantity: number;
  unit_price_cents: number;
  vat_rate: number;
  discount_percent: number;
};

export type SaveQuoteInput = {
  id: string;
  status: QuoteStatus;
  clientId: string | null;
  notes: string | null;
  lines: SaveQuoteLine[];
  expectedTtcCents: number;
};

/** Même fonction SQL que le web : transaction + revérification des totaux. */
export async function saveQuote(input: SaveQuoteInput): Promise<void> {
  const { error } = await supabase.rpc("save_quote", {
    p_quote_id: input.id,
    p_status: input.status,
    p_lines: input.lines,
    p_expected_ttc_cents: input.expectedTtcCents,
    p_client_id: input.clientId ?? undefined,
    p_notes: input.notes ?? undefined,
  });
  if (error) throw error;
}