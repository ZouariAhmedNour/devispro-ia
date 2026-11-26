import { useState } from "react";
import { computeQuoteTotals, type QuoteDraft, type QuoteLineCalcInput } from "@devispro/shared";
import type { CatalogItem } from "@/features/catalog/api";
import type { QuoteWithLines, SaveQuoteInput } from "./api";
import type { QuoteStatus } from "./status";
import {
  lineFromCatalog,
  lineFromDb,
  toCalc,
  toSaveLine,
  type EditorLine,
} from "./editor-lines";

export function useQuoteEditor(quote: QuoteWithLines, catalog: CatalogItem[]) {
  const [clientId, setClientIdState] = useState(quote.client_id ?? "");
  const [notes, setNotesState] = useState(quote.notes ?? "");
  const [status, setStatusState] = useState<QuoteStatus>(quote.status);
  const [lines, setLines] = useState<EditorLine[]>(() => quote.quote_lines.map(lineFromDb));
  const [dirty, setDirty] = useState(false);

  // Calcul en direct, avec le même code que les tests Vitest
  const calcLines = lines.map(toCalc);
  const hasInvalid = calcLines.some((l) => l === null);
  const totals = computeQuoteTotals(
    calcLines.filter((l): l is QuoteLineCalcInput => l !== null),
  );

  return {
    // état
    clientId,
    notes,
    status,
    lines,
    calcLines,
    hasInvalid,
    totals,
    dirty,

    // en-tête
    setClientId(value: string) {
      setClientIdState(value);
      setDirty(true);
    },
    setNotes(value: string) {
      setNotesState(value);
      setDirty(true);
    },
    setStatus(value: QuoteStatus) {
      setStatusState(value);
      setDirty(true);
    },

    // lignes
    updateLine(key: string, patch: Partial<EditorLine>) {
      setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
      setDirty(true);
    },
    removeLine(key: string) {
      setLines((ls) => ls.filter((l) => l.key !== key));
      setDirty(true);
    },
    addCatalogItem(item: CatalogItem) {
      setLines((ls) => [...ls, lineFromCatalog(item, 1)]);
      setDirty(true);
    },

    /** Ajoute les lignes proposées par l'IA ; renvoie le nombre de lignes ajoutées. */
    applyDraft(draft: QuoteDraft, transcript: string): number {
      const newLines = draft.lines.flatMap((l) => {
        const item = catalog.find((i) => i.id === l.catalog_item_id);
        return item ? [lineFromCatalog(item, l.quantity, l.note)] : [];
      });
      if (newLines.length > 0) {
        setLines((ls) => [...ls, ...newLines]);
        setDirty(true);
      }
      if (!notes.trim() && transcript.trim()) setNotesState(transcript.trim().slice(0, 120));
      return newLines.length;
    },

    // enregistrement
    toSaveInput(): SaveQuoteInput {
      return {
        id: quote.id,
        status,
        clientId: clientId || null,
        notes: notes.trim() || null,
        lines: lines.map((l, i) => toSaveLine(l, calcLines[i]!)),
        expectedTtcCents: totals.totalTtcCents,
      };
    },

     /** Aligne le statut affiché sur la base, sans le compter comme modification. */
    syncStatus(value: QuoteStatus) {
      setStatusState(value);
    },
    
    markSaved() {
      setDirty(false);
    },
  };
}

export type QuoteEditorState = ReturnType<typeof useQuoteEditor>;