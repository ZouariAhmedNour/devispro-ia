import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { computeQuoteTotals, formatEuros } from "@devispro/shared";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  createDraftQuote,
  listQuotes,
  toCalcLine,
  type QuoteListItem,
} from "../lib/quotes";
import { toMessage } from "../lib/errors";

export default function QuotesPage() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listQuotes()
      .then(setQuotes)
      .catch((e) => setError(toMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleNew() {
    try {
      const id = await createDraftQuote();
      navigate(`/devis/${id}`);
    } catch (err) {
      setError(toMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Devis</h1>
        <button
          onClick={handleNew}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          + Nouveau devis
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : quotes.length === 0 ? (
        <p className="text-slate-500">Aucun devis pour l'instant.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-xl border bg-white text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const totals = computeQuoteTotals(q.quote_lines.map(toCalcLine));
              return (
                <tr
                  key={q.id}
                  onClick={() => navigate(`/devis/${q.id}`)}
                  className="cursor-pointer border-t hover:bg-slate-50"
                >
                  <td className="px-3 py-2">
                    {new Date(q.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-3 py-2">{q.clients?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{q.notes ?? ""}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatEuros(totals.totalTtcCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}