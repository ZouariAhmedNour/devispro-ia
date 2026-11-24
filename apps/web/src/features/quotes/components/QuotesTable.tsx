import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { formatEuros } from "@devispro/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { QuoteListItem } from "../api";
import { StatusBadge } from "./StatusBadge";

export function QuotesTable({ quotes }: { quotes: QuoteListItem[] }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="pl-4">Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Total TTC</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((q) => (
            <TableRow
              key={q.id}
              onClick={() => navigate(`/devis/${q.id}`)}
              className="cursor-pointer"
            >
              <TableCell className="pl-4 text-muted-foreground">
                {new Date(q.created_at).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell className="font-medium">{q.clients?.name ?? "—"}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">{q.notes ?? ""}</TableCell>
              <TableCell>
                <StatusBadge status={q.status} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatEuros(q.total_ttc_cents)}
              </TableCell>
              <TableCell>
                <ChevronRight className="size-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}