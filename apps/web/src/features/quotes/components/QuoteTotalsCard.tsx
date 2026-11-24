import { ShieldCheck } from "lucide-react";
import { formatEuros, type QuoteTotals } from "@devispro/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toInput } from "../editor-lines";

export function QuoteTotalsCard({ totals }: { totals: QuoteTotals }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total HT</span>
          <span className="tabular-nums">{formatEuros(totals.totalHtCents)}</span>
        </div>
        {totals.vatByRate.map((v) => (
          <div key={v.rate} className="flex justify-between">
            <span className="text-muted-foreground">
              TVA {toInput(v.rate)} % <span className="text-xs">(sur {formatEuros(v.baseCents)})</span>
            </span>
            <span className="tabular-nums">{formatEuros(v.vatCents)}</span>
          </div>
        ))}
        <Separator className="my-3" />
        <div className="flex items-baseline justify-between">
          <span className="font-medium">Total TTC</span>
          <span className="text-2xl font-semibold tabular-nums">{formatEuros(totals.totalTtcCents)}</span>
        </div>
        <p className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Totaux revérifiés par le serveur à l'enregistrement.
        </p>
      </CardContent>
    </Card>
  );
}