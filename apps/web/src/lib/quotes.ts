import { TvaRateSchema, type QuoteLineCalcInput } from "@devispro/shared";
import { supabase } from "./supabase";

export const STATUS_LABELS = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  rejected: "Refusé",
} as const;

export const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
} as const;

/** Convertit une ligne de la base au format attendu par computeQuoteTotals. */
export function toCalcLine(line: {
  quantity: number;
  unit_price_cents: number;
  vat_rate: number;
}): QuoteLineCalcInput {
  return {
    quantity: line.quantity,
    unitPriceCents: line.unit_price_cents,
    vatRate: TvaRateSchema.parse(line.vat_rate),
  };
}

export async function listQuotes() {
  const { data, error } = await supabase
    .from("quotes")
    .select("id, status, notes, created_at, clients(name), quote_lines(quantity, unit_price_cents, vat_rate)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type QuoteListItem = Awaited<ReturnType<typeof listQuotes>>[number];

/** Crée un devis brouillon vide et renvoie son id. */
export async function createDraftQuote(): Promise<string> {
  const { data, error } = await supabase.from("quotes").insert({}).select("id").single();
  if (error) throw error;
  return data.id;
}