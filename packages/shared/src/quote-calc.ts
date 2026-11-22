import { z } from "zod";
import { TvaRateSchema, type TvaRate } from "./vat";

export const QuoteLineCalcSchema = z.object({
  quantity: z.number().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  vatRate: TvaRateSchema,
  discountPercent: z.number().min(0).max(100).default(0),
});

export type QuoteLineCalcInput = z.input<typeof QuoteLineCalcSchema>;

export interface VatBreakdown {
  rate: TvaRate;
  baseCents: number;
  vatCents: number;
}

export interface QuoteTotals {
  lineHtCents: number[];
  totalHtCents: number;
  vatByRate: VatBreakdown[];
  totalVatCents: number;
  totalTtcCents: number;
}

/** 12.5 -> 1250 (évite les erreurs de virgule flottante) */
const toHundredths = (n: number): number => Math.round(n * 100);

const sum = (values: number[]): number => values.reduce((acc, v) => acc + v, 0);

/** Montant HT d'une ligne, en centimes. */
export function lineHtCents(input: QuoteLineCalcInput): number {
  const { quantity, unitPriceCents, discountPercent } = QuoteLineCalcSchema.parse(input);

  // quantité en centièmes × prix en centimes, puis on revient aux centimes
  const grossCents = Math.round((toHundredths(quantity) * unitPriceCents) / 100);

  if (discountPercent === 0) return grossCents;

  // remise exprimée en centièmes de % : 12,5 % -> 1250
  const discount = toHundredths(discountPercent);
  return Math.round((grossCents * (10000 - discount)) / 10000);
}

/** Totaux d'un devis : HT, TVA ventilée par taux, TTC. */
export function computeQuoteTotals(lines: QuoteLineCalcInput[]): QuoteTotals {
  const parsed = lines.map((line) => QuoteLineCalcSchema.parse(line));
  const lineTotals = parsed.map(lineHtCents);

  const baseByRate = new Map<TvaRate, number>();
  parsed.forEach((line, i) => {
    const current = baseByRate.get(line.vatRate) ?? 0;
    baseByRate.set(line.vatRate, current + (lineTotals[i] ?? 0));
  });

  const vatByRate: VatBreakdown[] = [...baseByRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, baseCents]) => ({
      rate,
      baseCents,
      // taux en centièmes de % : 5,5 % -> 550
      vatCents: Math.round((baseCents * toHundredths(rate)) / 10000),
    }));

  const totalHtCents = sum(lineTotals);
  const totalVatCents = sum(vatByRate.map((v) => v.vatCents));

  return {
    lineHtCents: lineTotals,
    totalHtCents,
    vatByRate,
    totalVatCents,
    totalTtcCents: totalHtCents + totalVatCents,
  };
}