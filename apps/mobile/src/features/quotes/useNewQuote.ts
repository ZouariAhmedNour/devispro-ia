import { useState } from "react";
import * as Crypto from "expo-crypto";
import {
  TvaRateSchema,
  computeQuoteTotals,
  type QuoteDraft,
  type QuoteLineCalcInput,
} from "@devispro/shared";
import type { CatalogItem } from "@/features/catalog/api";
import type { SaveQuoteLine } from "./api";

export interface DraftLine {
  key: string;
  item: CatalogItem;
  quantity: string; // texte, pour permettre de taper "12,"
  note: string;
}

function parseQuantity(input: string): number | null {
  const n = Number(input.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Prix et TVA viennent TOUJOURS du catalogue. */
function toCalc(line: DraftLine): QuoteLineCalcInput | null {
  const quantity = parseQuantity(line.quantity);
  if (quantity === null) return null;
  return {
    quantity,
    unitPriceCents: line.item.unit_price_cents,
    vatRate: TvaRateSchema.parse(line.item.vat_rate),
  };
}

export function useNewQuote(catalog: CatalogItem[]) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [rejected, setRejected] = useState(0);

  const calcLines = lines.map(toCalc);
  const hasInvalid = calcLines.some((l) => l === null);
  const totals = computeQuoteTotals(calcLines.filter((l): l is QuoteLineCalcInput => l !== null));

  return {
    clientId,
    setClientId,
    description,
    setDescription,
    lines,
    calcLines,
    hasInvalid,
    totals,
    questions,
    rejected,

    /** Ajoute les lignes proposées par l'IA ; renvoie le nombre ajouté. */
    applyDraft(draft: QuoteDraft): number {
      const newLines = draft.lines.flatMap((l) => {
        const item = catalog.find((i) => i.id === l.catalog_item_id);
        return item
          ? [{ key: Crypto.randomUUID(), item, quantity: String(l.quantity).replace(".", ","), note: l.note }]
          : [];
      });
      setLines((ls) => [...ls, ...newLines]);
      setQuestions(draft.questions);
      setRejected(draft.rejected.length);
      return newLines.length;
    },

    updateQuantity(key: string, quantity: string) {
      setLines((ls) => ls.map((l) => (l.key === key ? { ...l, quantity } : l)));
    },

    removeLine(key: string) {
      setLines((ls) => ls.filter((l) => l.key !== key));
    },

    toSaveLines(): SaveQuoteLine[] {
      return lines.map((l, i) => ({
        catalog_item_id: l.item.id,
        label: l.note ? `${l.item.label} (${l.note})` : l.item.label,
        unit: l.item.unit,
        quantity: calcLines[i]!.quantity,
        unit_price_cents: l.item.unit_price_cents,
        vat_rate: l.item.vat_rate,
        discount_percent: 0,
      }));
    },
  };
}

export type NewQuoteState = ReturnType<typeof useNewQuote>;