import { TvaRateSchema, type Enums, type QuoteLineCalcInput } from "@devispro/shared";
import { supabase } from "./supabase";

export type QuoteStatus = Enums<"quote_status">;

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  rejected: "Refusé",
};

export const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

/** Convertit une ligne de la base au format attendu par computeQuoteTotals. */
export function toCalcLine(line: {
  quantity: number;
  unit_price_cents: number;
  vat_rate: number;
  discount_percent?: number;
}): QuoteLineCalcInput {
  return {
    quantity: line.quantity,
    unitPriceCents: line.unit_price_cents,
    vatRate: TvaRateSchema.parse(line.vat_rate),
    discountPercent: line.discount_percent ?? 0,
  };
}

// ---------- Liste ----------
export async function listQuotes() {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      "id, status, notes, created_at, clients(name), quote_lines(quantity, unit_price_cents, vat_rate, discount_percent)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type QuoteListItem = Awaited<ReturnType<typeof listQuotes>>[number];

export async function createDraftQuote(): Promise<string> {
  const { data, error } = await supabase.from("quotes").insert({}).select("id").single();
  if (error) throw error;
  return data.id;
}

// ---------- Éditeur ----------
export async function getQuote(id: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select("id, status, notes, client_id, quote_lines(*)")
    .eq("id", id)
    .order("position", { referencedTable: "quote_lines" })
    .single();
  if (error) throw error;
  return data;
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

export async function saveQuote(input: {
  id: string;
  status: QuoteStatus;
  clientId: string | null;
  notes: string | null;
  lines: SaveQuoteLine[];
}): Promise<void> {
  const { error } = await supabase.rpc("save_quote", {
    p_quote_id: input.id,
    p_status: input.status,
    p_lines: input.lines,
    p_client_id: input.clientId ?? undefined,
    p_notes: input.notes ?? undefined,
  });
  if (error) throw error;
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
}