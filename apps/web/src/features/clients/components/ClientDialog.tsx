import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
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
import type { Client } from "../api";
import { useSaveClient } from "../hooks";

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const EMPTY_FORM: FormState = { name: "", email: "", phone: "", address: "" };

const fromClient = (c: Client): FormState => ({
  name: c.name,
  email: c.email ?? "",
  phone: c.phone ?? "",
  address: c.address ?? "",
});

// "" -> null pour ne pas stocker de chaînes vides
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

export function ClientDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}) {
  const save = useSaveClient();
  const [form, setForm] = useState<FormState>(() => (client ? fromClient(client) : EMPTY_FORM));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Le nom du client est obligatoire.");
    setError(null);
    save.mutate(
      {
        id: client?.id,
        input: {
          name: form.name.trim(),
          email: orNull(form.email),
          phone: orNull(form.phone),
          address: orNull(form.address),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{client ? "Modifier le client" : "Nouveau client"}</DialogTitle>
            <DialogDescription>Ces informations apparaîtront sur tes devis.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" autoFocus placeholder="ex. Mme Durand" {...field("name")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="nom@exemple.fr" {...field("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" placeholder="06 12 34 56 78" {...field("phone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse du chantier</Label>
            <Input id="address" placeholder="12 rue des Lilas, 69003 Lyon" {...field("address")} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              {client ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}