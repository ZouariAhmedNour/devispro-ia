import { Mail, MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { Client } from "../api";
import { useDeleteClient } from "../hooks";

/** "Mme Durand" -> "MD" */
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

export function ClientsTable({
  clients,
  onEdit,
}: {
  clients: Client[];
  onEdit: (client: Client) => void;
}) {
  const remove = useDeleteClient();

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="pl-4">Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Adresse</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(c.name)}
                  </div>
                  <span className="font-medium">{c.name}</span>
                </div>
              </TableCell>
              <TableCell className="space-y-1 text-sm text-muted-foreground">
                {c.email && (
                  <div className="flex items-center gap-2"><Mail className="size-3.5" />{c.email}</div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2"><Phone className="size-3.5" />{c.phone}</div>
                )}
                {!c.email && !c.phone && "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {c.address ? (
                  <div className="flex items-center gap-2"><MapPin className="size-3.5 shrink-0" />{c.address}</div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" title="Modifier" onClick={() => onEdit(c)}>
                    <Pencil className="size-4" />
                  </Button>
                  <ConfirmDialog
                    title={`Supprimer « ${c.name} » ?`}
                    description="Ses devis sont conservés, mais ne seront plus rattachés à aucun client."
                    onConfirm={() => remove.mutate(c.id)}
                    trigger={
                      <Button variant="ghost" size="icon" title="Supprimer">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}