import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { TvaRateSchema, centsToInput, parseEurosToCents } from "@devispro/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CatalogItem } from "../api";
import { useSaveCatalogItem } from "../hooks";

const UNITS = ["m²", "m", "h", "u", "forfait"];
const VAT_RATES = ["5.5", "10", "20"];

interface FormState {
  label: string;
  unit: string;
  price: string;
  vatRate: string;
}

const EMPTY_FORM: FormState = { label: "", unit: "m²", price: "", vatRate: "10" };

const fromItem = (item: CatalogItem): FormState => ({
  label: item.label,
  unit: item.unit,
  price: centsToInput(item.unit_price_cents),
  vatRate: String(item.vat_rate),
});

export function CatalogItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogItem | null;
}) {
  const save = useSaveCatalogItem();
  const [form, setForm] = useState<FormState>(() => (item ? fromItem(item) : EMPTY_FORM));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cents = parseEurosToCents(form.price);
    const vat = TvaRateSchema.safeParse(Number(form.vatRate));
    if (!form.label.trim()) return setError("Le libellé est obligatoire.");
    if (cents === null) return setError("Prix invalide (exemple : 35,50).");
    if (!vat.success) return setError("Taux de TVA invalide.");

    setError(null);
    save.mutate(
      {
        id: item?.id,
        input: { label: form.label.trim(), unit: form.unit, unit_price_cents: cents, vat_rate: vat.data },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{item ? "Modifier la prestation" : "Nouvelle prestation"}</DialogTitle>
            <DialogDescription>
              Prix hors taxes. Ils sont repris tels quels dans tes devis, y compris ceux générés par l'IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="label">Libellé</Label>
            <Input
              id="label"
              autoFocus
              placeholder="ex. Pose carrelage sol"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Unité</Label>
              <Select value={form.unit} onValueChange={(unit) => setForm({ ...form, unit })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Prix HT (€)</Label>
              <Input
                id="price"
                inputMode="decimal"
                placeholder="35,00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>TVA</Label>
              <Select value={form.vatRate} onValueChange={(vatRate) => setForm({ ...form, vatRate })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_RATES.map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(".", ",")} %</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              {item ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}