import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client } from "@/features/clients/api";
import { QUOTE_STATUSES, STATUS_LABELS, type QuoteStatus } from "../status";
import type { QuoteEditorState } from "../useQuoteEditor";

// Radix Select n'accepte pas une valeur vide : on utilise une valeur sentinelle
const NO_CLIENT = "none";

export function QuoteHeaderForm({
  editor,
  clients,
}: {
  editor: QuoteEditorState;
  clients: Client[];
}) {
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Client</Label>
          <Select
            value={editor.clientId || NO_CLIENT}
            onValueChange={(v) => editor.setClientId(v === NO_CLIENT ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CLIENT}>Aucun client</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <Select value={editor.status} onValueChange={(v) => editor.setStatus(v as QuoteStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUOTE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Description</Label>
          <Input
            id="notes"
            value={editor.notes}
            onChange={(e) => editor.setNotes(e.target.value)}
            placeholder="ex. Salle de bain, 12 m²"
          />
        </div>
      </CardContent>
    </Card>
  );
}