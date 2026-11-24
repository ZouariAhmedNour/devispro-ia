import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  TvaRateSchema,
  centsToInput,
  computeQuoteTotals,
  formatEuros,
  lineHtCents,
  parseEurosToCents,
  type QuoteLineCalcInput,
  type TvaRate,
} from "@devispro/shared";
import { listCatalogItems, type CatalogItem } from "../lib/catalog";
import { listClients, type Client } from "../lib/clients";
import {
  STATUS_LABELS,
  deleteQuote,
  getQuote,
  saveQuote,
  type QuoteStatus,
} from "../lib/quotes";
import { generateQuoteDraft } from "../lib/ai";
import { toMessage } from "../lib/errors";

// Une ligne telle qu'éditée à l'écran : les champs numériques restent des chaînes
// pour permettre de taper "12," sans que la saisie soit bloquée.
interface EditorLine {
  key: string;
  catalogItemId: string | null;
  label: string;
  unit: string;
  quantity: string;
  price: string;
  vatRate: TvaRate;
  discount: string;
}

const VAT_RATES: TvaRate[] = [5.5, 10, 20];
const STATUSES = Object.keys(STATUS_LABELS) as QuoteStatus[];

const toInput = (n: number) => String(n).replace(".", ",");

function parseDecimal(input: string): number | null {
  if (input.trim() === "") return null;
  const n = Number(input.trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Ligne d'écran -> ligne de calcul, ou null si la saisie est invalide. */
function toCalc(line: EditorLine): QuoteLineCalcInput | null {
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

/** Ligne de catalogue -> ligne d'éditeur (prix et TVA viennent TOUJOURS du catalogue). */
function lineFromCatalog(item: CatalogItem, quantity: number, note = ""): EditorLine {
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

export default function QuoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("draft");
  const [lines, setLines] = useState<EditorLine[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");

  // IA
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiRejected, setAiRejected] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Chargement : devis + catalogue + clients en parallèle
  useEffect(() => {
    if (!id) return;
    Promise.all([getQuote(id), listCatalogItems(), listClients()])
      .then(([quote, items, cls]) => {
        setCatalog(items.filter((i) => i.active));
        setClients(cls);
        setClientId(quote.client_id ?? "");
        setNotes(quote.notes ?? "");
        setStatus(quote.status);
        setLines(
          quote.quote_lines.map((l) => ({
            key: l.id,
            catalogItemId: l.catalog_item_id,
            label: l.label,
            unit: l.unit,
            quantity: toInput(l.quantity),
            price: centsToInput(l.unit_price_cents),
            vatRate: TvaRateSchema.parse(l.vat_rate),
            discount: l.discount_percent ? toInput(l.discount_percent) : "",
          })),
        );
      })
      .catch(() => setError("Devis introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  // Calcul en direct (le même code que les tests Vitest)
  const calcLines = lines.map(toCalc);
  const hasInvalid = calcLines.some((l) => l === null);
  const totals = computeQuoteTotals(
    calcLines.filter((l): l is QuoteLineCalcInput => l !== null),
  );

  function updateLine(key: string, patch: Partial<EditorLine>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setSaved(false);
  }

  function removeLine(key: string) {
    setLines((ls) => ls.filter((l) => l.key !== key));
    setSaved(false);
  }

  function addFromCatalog() {
    const item = catalog.find((i) => i.id === selectedItemId);
    if (!item) return;
    setLines((ls) => [...ls, lineFromCatalog(item, 1)]);
    setSelectedItemId("");
    setSaved(false);
  }

  async function handleGenerate() {
    setAiBusy(true);
    setAiError(null);
    setAiQuestions([]);
    setAiRejected(0);
    try {
      const draft = await generateQuoteDraft(aiText);

      // On retrouve chaque prestation dans le catalogue chargé : prix et TVA viennent de là
      const newLines = draft.lines.flatMap((l) => {
        const item = catalog.find((i) => i.id === l.catalog_item_id);
        return item ? [lineFromCatalog(item, l.quantity, l.note)] : [];
      });

      setLines((ls) => [...ls, ...newLines]);
      setAiQuestions(draft.questions);
      setAiRejected(draft.rejected.length);
      if (!notes.trim()) setNotes(aiText.trim().slice(0, 120));
      setSaved(false);
    } catch (err) {
      setAiError(toMessage(err));
    } finally {
      setAiBusy(false);
    }
  }

  async function handleSave() {
    if (!id || hasInvalid) return;
    setBusy(true);
    setError(null);
    try {
      await saveQuote({
        id,
        status,
        clientId: clientId || null,
        notes: notes.trim() || null,
        lines: lines.map((l, i) => {
          const c = calcLines[i]!;
          return {
            catalog_item_id: l.catalogItemId,
            label: l.label.trim(),
            unit: l.unit,
            quantity: c.quantity,
            unit_price_cents: c.unitPriceCents,
            vat_rate: c.vatRate,
            discount_percent: c.discountPercent ?? 0,
          };
        }),
        expectedTtcCents: totals.totalTtcCents,
      });
      setSaved(true);
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm("Supprimer ce devis ?")) return;
    try {
      await deleteQuote(id);
      navigate("/devis");
    } catch (err) {
      setError(toMessage(err));
    }
  }

  if (loading) return <p className="text-slate-500">Chargement…</p>;
  if (error === "Devis introuvable.") {
    return (
      <div className="space-y-2">
        <p className="text-red-600">Devis introuvable.</p>
        <Link to="/devis" className="text-blue-700 hover:underline">← Retour aux devis</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/devis" className="text-sm text-blue-700 hover:underline">← Devis</Link>
        <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
          Supprimer le devis
        </button>
      </div>

      {/* En-tête */}
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3">
        <label className="text-sm">
          Client
          <select
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setSaved(false); }}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="">— Aucun —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Statut
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as QuoteStatus); setSaved(false); }}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Description
          <input
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
            placeholder="ex. Salle de bain, 12 m²"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      {/* Génération IA */}
      <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
        <h2 className="font-semibold text-violet-900">✨ Générer avec l'IA</h2>
        <textarea
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          rows={3}
          placeholder="Décris le chantier, ex. : Salle de bain de 12 m², enlever l'ancien carrelage et poser du carrelage neuf au sol."
          className="w-full rounded border bg-white px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={aiBusy || aiText.trim().length < 3}
            className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {aiBusy ? "Génération…" : "Générer les lignes"}
          </button>
          <span className="text-xs text-violet-800">
            L'IA choisit uniquement dans ton catalogue. Les prix viennent toujours de ton catalogue.
          </span>
        </div>

        {aiError && <p className="text-sm text-red-600">{aiError}</p>}

        {aiQuestions.length > 0 && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">L'IA a besoin de précisions :</p>
            <ul className="mt-1 list-disc pl-5">
              {aiQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">Complète ta description puis relance la génération.</p>
          </div>
        )}

        {aiRejected > 0 && (
          <p className="text-xs text-slate-600">
            {aiRejected} proposition(s) de l'IA écartée(s) car absente(s) de ton catalogue.
          </p>
        )}
      </div>

      {/* Lignes */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Prestation</th>
              <th className="px-3 py-2">Qté</th>
              <th className="px-3 py-2">Unité</th>
              <th className="px-3 py-2">Prix HT (€)</th>
              <th className="px-3 py-2">TVA</th>
              <th className="px-3 py-2">Remise %</th>
              <th className="px-3 py-2 text-right">Total HT</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                  Aucune ligne. Utilise l'IA ou ajoute une prestation depuis ton catalogue.
                </td>
              </tr>
            )}
            {lines.map((l, i) => {
              const calc = calcLines[i];
              const invalid = calc === null;
              return (
                <tr key={l.key} className={`border-t ${invalid ? "bg-red-50" : ""}`}>
                  <td className="px-3 py-2">
                    <input
                      value={l.label}
                      onChange={(e) => updateLine(l.key, { label: e.target.value })}
                      className="w-full min-w-48 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      inputMode="decimal"
                      value={l.quantity}
                      onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                      className="w-20 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 text-slate-600">{l.unit}</td>
                  <td className="px-3 py-2">
                    <input
                      inputMode="decimal"
                      value={l.price}
                      onChange={(e) => updateLine(l.key, { price: e.target.value })}
                      className="w-24 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={l.vatRate}
                      onChange={(e) =>
                        updateLine(l.key, { vatRate: TvaRateSchema.parse(Number(e.target.value)) })
                      }
                      className="rounded border px-2 py-1"
                    >
                      {VAT_RATES.map((r) => (
                        <option key={r} value={r}>{toInput(r)} %</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      inputMode="decimal"
                      placeholder="0"
                      value={l.discount}
                      onChange={(e) => updateLine(l.key, { discount: e.target.value })}
                      className="w-16 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                    {invalid ? <span className="text-red-600">invalide</span> : formatEuros(lineHtCents(calc))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => removeLine(l.key)} className="text-red-600 hover:underline">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Ajout manuel depuis le catalogue */}
        <div className="flex gap-2 border-t p-3">
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="flex-1 rounded border px-3 py-2 text-sm"
          >
            <option value="">Choisir une prestation du catalogue…</option>
            {catalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({formatEuros(item.unit_price_cents)} / {item.unit})
              </option>
            ))}
          </select>
          <button
            onClick={addFromCatalog}
            disabled={!selectedItemId}
            className="rounded border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Totaux + enregistrement */}
      <div className="flex flex-col items-end gap-4">
        <div className="w-full max-w-xs space-y-1 rounded-xl border bg-white p-4 text-sm">
          <div className="flex justify-between">
            <span>Total HT</span>
            <span>{formatEuros(totals.totalHtCents)}</span>
          </div>
          {totals.vatByRate.map((v) => (
            <div key={v.rate} className="flex justify-between text-slate-600">
              <span>TVA {toInput(v.rate)} % (sur {formatEuros(v.baseCents)})</span>
              <span>{formatEuros(v.vatCents)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total TTC</span>
            <span>{formatEuros(totals.totalTtcCents)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {hasInvalid && (
          <p className="text-sm text-red-600">Corrige les lignes en rouge avant d'enregistrer.</p>
        )}

        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-700">✓ Enregistré</span>}
          <button
            onClick={handleSave}
            disabled={busy || hasInvalid}
            className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Enregistrer le devis"}
          </button>
        </div>
      </div>
    </div>
  );
}