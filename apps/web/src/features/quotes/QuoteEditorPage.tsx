import { Link, useParams } from "react-router";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { useCatalogItems } from "@/features/catalog/hooks";
import { useClients } from "@/features/clients/hooks";
import { useQuote } from "./hooks";
import { QuoteEditor } from "./components/QuoteEditor";

export default function QuoteEditorPage() {
  const { id = "" } = useParams();
  const quote = useQuote(id);
  const catalog = useCatalogItems(); // servi par le cache si déjà chargé
  const clients = useClients();

  if (quote.isLoading || catalog.isLoading || clients.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (quote.error || !quote.data) {
    return (
      <EmptyState
        icon={FileX}
        title="Devis introuvable"
        description="Ce devis n'existe pas, ou il appartient à une autre entreprise."
        action={
          <Button asChild variant="outline">
            <Link to="/devis">Retour aux devis</Link>
          </Button>
        }
      />
    );
  }

  return (
    <QuoteEditor
      key={quote.data.id}
      quote={quote.data}
      catalog={(catalog.data ?? []).filter((i) => i.active)}
      clients={clients.data ?? []}
    />
  );
}