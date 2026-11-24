import { Pencil, Power, Trash2 } from "lucide-react";
import { formatEuros } from "@devispro/shared";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import type { CatalogItem } from "../api";
import { useDeleteCatalogItem, useToggleCatalogItem } from "../hooks";

export function CatalogTable({
  items,
  onEdit,
}: {
  items: CatalogItem[];
  onEdit: (item: CatalogItem) => void;
}) {
  const toggle = useToggleCatalogItem();
  const remove = useDeleteCatalogItem();

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="pl-4">Prestation</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead className="text-right">Prix HT</TableHead>
            <TableHead className="text-right">TVA</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className={cn(!item.active && "opacity-60")}>
              <TableCell className="pl-4 font-medium">
                <div className="flex items-center gap-2">
                  {item.label}
                  {!item.active && <Badge variant="secondary">Inactive</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{item.unit}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEuros(item.unit_price_cents)}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">{String(item.vat_rate).replace(".", ",")} %</Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" title="Modifier" onClick={() => onEdit(item)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={item.active ? "Désactiver" : "Réactiver"}
                    onClick={() => toggle.mutate(item)}
                  >
                    <Power className="size-4" />
                  </Button>
                  <ConfirmDialog
                    title={`Supprimer « ${item.label} » ?`}
                    description="Les devis existants gardent leurs lignes. Pour simplement ne plus la proposer, désactive-la plutôt."
                    onConfirm={() => remove.mutate(item.id)}
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