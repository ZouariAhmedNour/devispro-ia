import { useEffect, useState, type FormEvent } from "react";
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
  type Client,
} from "../lib/clients";
import { toMessage } from "../lib/errors";

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
}
const EMPTY_FORM: FormState = { name: "", email: "", phone: "", address: "" };

// "" -> null pour ne pas stocker de chaînes vides en base
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch((e) => setError(toMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setClients(await listClients());
  }

  function startEdit(c: Client) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Le nom du client est obligatoire.");
      return;
    }
    const input = {
      name: form.name.trim(),
      email: orNull(form.email),
      phone: orNull(form.phone),
      address: orNull(form.address),
    };
    try {
      if (editingId) await updateClient(editingId, input);
      else await createClient(input);
      cancelEdit();
      await refresh();
    } catch (err) {
      setError(toMessage(err));
    }
  }

  async function handleDelete(c: Client) {
    if (!window.confirm(`Supprimer le client « ${c.name} » ?`)) return;
    try {
      await deleteClient(c.id);
      await refresh();
    } catch (err) {
      setError(toMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clients</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <input
          placeholder="Nom (ex. Mme Durand)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded border px-3 py-2"
        />
        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded border px-3 py-2"
        />
        <input
          placeholder="Téléphone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded border px-3 py-2"
        />
        <input
          placeholder="Adresse du chantier"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="rounded border px-3 py-2"
        />
        <div className="flex gap-2 sm:col-span-2">
          <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            {editingId ? "Enregistrer" : "Ajouter le client"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded border px-3 py-2">
              Annuler
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : clients.length === 0 ? (
        <p className="text-slate-500">Aucun client pour l'instant.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-xl border bg-white text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Adresse</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-slate-600">
                  {c.email}
                  {c.email && c.phone && <br />}
                  {c.phone}
                </td>
                <td className="px-3 py-2 text-slate-600">{c.address}</td>
                <td className="space-x-2 px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => startEdit(c)} className="text-blue-700 hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(c)} className="text-red-600 hover:underline">
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