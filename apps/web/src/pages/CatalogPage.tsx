import { useEffect, useState, type FormEvent } from "react";
import {
  TvaRateSchema,
  centsToInput,
  formatEuros,
  parseEurosToCents,
} from "@devispro/shared";
import {
  createCatalogItem,
  deleteCatalogItem,
  listCatalogItems,
  updateCatalogItem,
  type CatalogItem,
} from "../lib/catalog";
import { toMessage } from "../lib/errors";

const UNITS = ["m²", "m", "h", "u", "forfait"];
const VAT_RATES = ["5.5", "10", "20"];

interface FormState {
  label: string;
  unit: string;
  price: string;
  vatRate: string;
}
const EMPTY_FORM: FormState = { label: "", unit: "m²", price: "", vatRate: "10" };

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    listCatalogItems()
      .then(setItems)
      .catch((e) => setError(toMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setItems(await listCatalogItems());
  }

  function startEdit(item: CatalogItem) {
    setEditingId(item.id);
    setForm({
      label: item.label,
      unit: item.unit,
      price: centsToInput(item.unit_price_cents),
      vatRate: String(item.vat_rate),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cents = parseEurosToCents(form.price);
    const vat = TvaRateSchema.safeParse(Number(form.vatRate));
    if (!form.label.trim() || cents === null || !vat.success) {
      setError("Vérifie le libellé, le prix (ex. 35,50) et le taux de TVA.");
      return;
    }

    const input = {
      label: form.label.trim(),
      unit: form.unit,
      unit_price_cents: cents,
      vat_rate: vat.data,
    };

    try {
      if (editingId) await updateCatalogItem(editingId, input);
      else await createCatalogItem(input);
      cancelEdit();
      await refresh();
    } catch (err) {
      setError(toMessage(err));
    }
  }

  async function toggleActive(item: CatalogItem) {
    try {
      await updateCatalogItem(item.id, { active: !item.active });
      await refresh();
    } catch (err) {
      setError(toMessage(err));
    }
  }

  async function handleDelete(item: CatalogItem) {
    if (!window.confirm(`Supprimer « ${item.label} » ?`)) return;
    try {
      await deleteCatalogItem(item.id);
      await refresh();
    } catch (err) {
      setError(toMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Catalogue de prestations</h1>

      {/* Formulaire ajout / modification */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <input
          placeholder="Libellé (ex. Pose carrelage sol)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="rounded border px-3 py-2"
        />
        <select
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          className="rounded border px-3 py-2"
        >
          {UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
        <input
          placeholder="Prix HT (€)"
          inputMode="decimal"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="rounded border px-3 py-2"
        />
        <select
          value={form.vatRate}
          onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
          className="rounded border px-3 py-2"
        >
          {VAT_RATES.map((r) => (
            <option key={r} value={r}>
              TVA {r.replace(".", ",")} %
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            {editingId ? "Enregistrer" : "Ajouter"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded border px-3 py-2">
              Annuler
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Liste */}
      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500">Aucune prestation pour l'instant.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-xl border bg-white text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Prestation</th>
              <th className="px-3 py-2">Unité</th>
              <th className="px-3 py-2 text-right">Prix HT</th>
              <th className="px-3 py-2 text-right">TVA</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={`border-t ${item.active ? "" : "opacity-50"}`}>
                <td className="px-3 py-2">{item.label}</td>
                <td className="px-3 py-2">{item.unit}</td>
                <td className="px-3 py-2 text-right">{formatEuros(item.unit_price_cents)}</td>
                <td className="px-3 py-2 text-right">
                  {String(item.vat_rate).replace(".", ",")} %
                </td>
                <td className="space-x-2 px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => startEdit(item)} className="text-blue-700 hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => toggleActive(item)} className="text-slate-600 hover:underline">
                    {item.active ? "Désactiver" : "Activer"}
                  </button>
                  <button onClick={() => handleDelete(item)} className="text-red-600 hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}