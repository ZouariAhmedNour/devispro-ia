import { useState } from "react";
import { ListPlus, Plus, X } from "lucide-react";
import { TvaRateSchema, formatEuros, lineHtCents } from "@devispro/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CatalogItem } from "@/features/catalog/api";
import { cn } from "@/lib/utils";
import { VAT_RATES, toInput } from "../editor-lines";
import type { QuoteEditorState } from "../useQuoteEditor";

export function QuoteLinesTable({
  editor,
  catalog,
}: {
  editor: QuoteEditorState;
  catalog: CatalogItem[];
}) {
  const [selectedId, setSelectedId] = useState("");

  function handleAdd() {
    const item = catalog.find((i) => i.id === selectedId);
    if (!item) return;
    editor.addCatalogItem(item);
    setSelectedId("");
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-medium">Lignes du devis</h2>
        <span className="text-xs text-muted-foreground">{editor.lines.length} ligne(s)</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="pl-4">Prestation</TableHead>
            <TableHead>Qté</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead>Prix HT</TableHead>
            <TableHead>TVA</TableHead>
            <TableHead>Remise %</TableHead>
            <TableHead className="text-right">Total HT</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {editor.lines.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                <ListPlus className="mx-auto mb-2 size-6" />
                Aucune ligne. Utilise l'assistant IA ou ajoute une prestation ci-dessous.
              </TableCell>
            </TableRow>
          )}

          {editor.lines.map((l, i) => {
            const calc = editor.calcLines[i];
            const invalid = calc === null;
            return (
              <TableRow key={l.key} className={cn(invalid && "bg-destructive/5")}>
                <TableCell className="pl-4">
                  <Input
                    value={l.label}
                    onChange={(e) => editor.updateLine(l.key, { label: e.target.value })}
                    className="h-8 min-w-52"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={l.quantity}
                    onChange={(e) => editor.updateLine(l.key, { quantity: e.target.value })}
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{l.unit}</TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={l.price}
                    onChange={(e) => editor.updateLine(l.key, { price: e.target.value })}
                    className="h-8 w-24"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={String(l.vatRate)}
                    onValueChange={(v) => editor.updateLine(l.key, { vatRate: TvaRateSchema.parse(Number(v)) })}
                  >
                    <SelectTrigger className="h-8 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_RATES.map((r) => (
                        <SelectItem key={r} value={String(r)}>{toInput(r)} %</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    placeholder="0"
                    value={l.discount}
                    onChange={(e) => editor.updateLine(l.key, { discount: e.target.value })}
                    className="h-8 w-16"
                  />
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                  {invalid ? (
                    <span className="text-destructive">invalide</span>
                  ) : (
                    formatEuros(lineHtCents(calc))
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" title="Retirer" onClick={() => editor.removeLine(l.key)}>
                    <X className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Ajout manuel depuis le catalogue */}
      <div className="flex gap-2 border-t bg-muted/30 p-3">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="flex-1 bg-background">
            <SelectValue placeholder="Ajouter une prestation du catalogue…" />
          </SelectTrigger>
          <SelectContent>
            {catalog.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label} · {formatEuros(item.unit_price_cents)} / {item.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleAdd} disabled={!selectedId}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>
    </Card>
  );
}