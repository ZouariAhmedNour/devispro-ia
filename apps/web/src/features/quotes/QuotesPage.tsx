import { useNavigate } from "react-router";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, FilePen, FileText, Loader2, Plus, Send } from "lucide-react";
import { formatEuros } from "@devispro/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { useCreateDraftQuote, useQuotes } from "./hooks";
import { QuotesTable } from "./components/QuotesTable";

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuotesPage() {
  const navigate = useNavigate();
  const { data: quotes = [], isLoading, error } = useQuotes();
  const create = useCreateDraftQuote();

  const handleNew = () =>
    create.mutate(undefined, { onSuccess: (id) => navigate(`/devis/${id}`) });

  const drafts = quotes.filter((q) => q.status === "draft").length;
  const sent = quotes.filter((q) => q.status === "sent").length;
  const acceptedTotal = quotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + q.total_ttc_cents, 0);

  const newButton = (
    <Button onClick={handleNew} disabled={create.isPending}>
      {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Nouveau devis
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Devis"
        description="Prépare, relis et suis tes devis. L'assistant IA les pré-remplit à partir de ton catalogue."
        actions={newButton}
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorAlert error={error} title="Impossible de charger les devis" />
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun devis pour l'instant"
          description="Crée ton premier devis : décris le chantier en une phrase, l'IA s'occupe des lignes."
          action={newButton}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Brouillons" value={String(drafts)} icon={FilePen} />
            <StatCard label="Envoyés, en attente" value={String(sent)} icon={Send} />
            <StatCard label="Montant accepté (TTC)" value={formatEuros(acceptedTotal)} icon={CheckCircle2} />
          </div>
          <QuotesTable quotes={quotes} />
        </div>
      )}
    </>
  );
}