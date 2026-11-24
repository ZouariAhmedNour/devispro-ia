import {
  TvaRateSchema,
  centsToInput,
  parseEurosToCents,
  type QuoteLineCalcInput,
  type TvaRate,
} from "@devispro/shared";
import type { CatalogItem } from "@/features/catalog/api";
import type { QuoteLineRow, SaveQuoteLine } from "./api";

/** Ligne telle qu'éditée à l'écran : champs numériques en texte pour permettre "12,". */
export interface EditorLine {
  key: string;
  catalogItemId: string | null;
  label: string;
  unit: string;
  quantity: string;
  price: string;
  vatRate: TvaRate;
  discount: string;
}

export const VAT_RATES: TvaRate[] = [5.5, 10, 20];

/** 12.5 -> "12,5" */
export const toInput = (n: number) => String(n).replace(".", ",");

/** "12,5" -> 12.5 ; "1 000,5" -> 1000.5 ; invalide -> null */
export function parseDecimal(input: string): number | null {
  if (input.trim() === "") return null;
  const n = Number(input.trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Ligne d'écran -> ligne de calcul, ou null si la saisie est invalide. */
export function toCalc(line: EditorLine): QuoteLineCalcInput | null {
  const quantity = parseDecimal(line.quantity);
  const unitPriceCents = parseEurosToCents(line.price);
  const discountPercent = line.discount.trim() === "" ? 0 : parseDecimal(line.discount);
  if (
    quantity === null || quantity <= 0 ||
    unitPriceCents === null ||
    discountPercent === null || discountPercent < 0 || discountPercent > 100
  ) {
    return null;
  }
  return { quantity, unitPriceCents, vatRate: line.vatRate, discountPercent };
}

/** Prestation du catalogue -> ligne (prix et TVA viennent TOUJOURS du catalogue). */
export function lineFromCatalog(item: CatalogItem, quantity: number, note = ""): EditorLine {
  return {
    key: crypto.randomUUID(),
    catalogItemId: item.id,
    label: note ? `${item.label} (${note})` : item.label,
    unit: item.unit,
    quantity: toInput(quantity),
    price: centsToInput(item.unit_price_cents),
    vatRate: TvaRateSchema.parse(item.vat_rate),
    discount: "",
  };
}

/** Ligne enregistrée en base -> ligne d'écran. */
export function lineFromDb(row: QuoteLineRow): EditorLine {
  return {
    key: row.id,
    catalogItemId: row.catalog_item_id,
    label: row.label,
    unit: row.unit,
    quantity: toInput(row.quantity),
    price: centsToInput(row.unit_price_cents),
    vatRate: TvaRateSchema.parse(row.vat_rate),
    discount: row.discount_percent ? toInput(row.discount_percent) : "",
  };
}

/** Ligne d'écran (valide) -> format attendu par save_quote. */
export function toSaveLine(line: EditorLine, calc: QuoteLineCalcInput): SaveQuoteLine {
  return {
    catalog_item_id: line.catalogItemId,
    label: line.label.trim(),
    unit: line.unit,
    quantity: calc.quantity,
    unit_price_cents: calc.unitPriceCents,
    vat_rate: calc.vatRate,
    discount_percent: calc.discountPercent ?? 0,
  };
}