import { Link, useNavigate } from "react-router";
import { ArrowLeft, FileDown, Loader2, Save, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { CatalogItem } from "@/features/catalog/api";
import type { Client } from "@/features/clients/api";
import type { QuoteWithLines } from "../api";
import { useDeleteQuote, useQuotePdf, useSaveQuote } from "../hooks";
import { useQuoteEditor } from "../useQuoteEditor";
import { AiAssistantPanel } from "./AiAssistantPanel";
import { QuoteHeaderForm } from "./QuoteHeaderForm";
import { QuoteLinesTable } from "./QuoteLinesTable";
import { QuoteTotalsCard } from "./QuoteTotalsCard";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "@/features/auth/useAuth";
import { useState } from "react";
import { SendQuoteDialog } from "./SendQuoteDialog";


export function QuoteEditor({
  quote,
  catalog,
  clients,
}: {
  quote: QuoteWithLines;
  catalog: CatalogItem[];
  clients: Client[];
}) {
  const navigate = useNavigate();
  const editor = useQuoteEditor(quote, catalog);
  const save = useSaveQuote();
  const remove = useDeleteQuote();

  const pdf = useQuotePdf();

  const { profile } = useAuth();
  const pdfForSend = useQuotePdf();
  const [send, setSend] = useState<{ url: string; key: number } | null>(null);
  const client = clients.find((c) => c.id === editor.clientId) ?? null;

  function handleSend() {
    pdfForSend.mutate(quote.id, {
      onSuccess: (url) => setSend((s) => ({ url, key: (s?.key ?? 0) + 1 })),
    });
  }

  function handlePdf() {
    // On ouvre l'onglet tout de suite (sinon le navigateur bloque la fenêtre ouverte après un appel réseau)
    const win = window.open("", "_blank");
    pdf.mutate(quote.id, {
      onSuccess: (url) => {
        if (win) win.location.href = url;
        else window.location.href = url;
      },
      onError: () => win?.close(),
    });
  }

  function handleSave() {
    if (editor.hasInvalid) return;
    save.mutate(editor.toSaveInput(), { onSuccess: () => editor.markSaved() });
  }

  return (
    <div className="space-y-6">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            to="/devis"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Devis
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {editor.notes || "Nouveau devis"}
            </h1>
            <StatusBadge status={editor.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editor.dirty && (
            <span className="text-xs text-amber-600">Modifications non enregistrées</span>
          )}
          <ConfirmDialog
            title="Supprimer ce devis ?"
            description="Cette action est définitive."
            onConfirm={() => remove.mutate(quote.id, { onSuccess: () => navigate("/devis") })}
            trigger={
              <Button variant="outline" size="icon" title="Supprimer le devis">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
          />
           <Button
            variant="outline"
            onClick={handlePdf}
            disabled={pdf.isPending || editor.dirty || editor.lines.length === 0}
            title={editor.dirty ? "Enregistre d'abord le devis" : "Télécharger le PDF"}
          >
            {pdf.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            PDF
          </Button>

           <Button
            variant="outline"
            onClick={handleSend}
            disabled={pdfForSend.isPending || editor.dirty || editor.lines.length === 0}
            title={editor.dirty ? "Enregistre d'abord le devis" : "Envoyer au client"}
          >
            {pdfForSend.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Envoyer
          </Button>

          <Button onClick={handleSave} disabled={save.isPending || editor.hasInvalid}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Contenu : colonne principale + récapitulatif collant */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <QuoteHeaderForm editor={editor} clients={clients} />
          <AiAssistantPanel onDraft={editor.applyDraft} />
          <QuoteLinesTable editor={editor} catalog={catalog} />
        </div>
        <div className="space-y-3 lg:sticky lg:top-8 lg:self-start">
          <QuoteTotalsCard totals={editor.totals} />
          {editor.hasInvalid && (
            <p className="text-sm text-destructive">Corrige les lignes en rouge avant d'enregistrer.</p>
          )}
        </div>
      </div>
      {send && (
        <SendQuoteDialog
          key={send.key}
          open
          onOpenChange={(open) => !open && setSend(null)}
          quoteId={quote.id}
          url={send.url}
          client={client}
          companyName={profile?.companyName ?? ""}
          status={editor.status}
          onSent={() => editor.syncStatus("sent")}
        />
      )}
    </div>
  );
}