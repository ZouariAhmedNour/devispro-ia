import { useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import type { CatalogItem } from "./api";
import { useCatalogItems } from "./hooks";
import { CatalogItemDialog } from "./components/CatalogItemDialog";
import { CatalogTable } from "./components/CatalogTable";

export default function CatalogPage() {
  const { data: items = [], isLoading, error } = useCatalogItems();
  const [search, setSearch] = useState("");
  // key : un formulaire neuf à chaque ouverture
  const [dialog, setDialog] = useState({ open: false, item: null as CatalogItem | null, key: 0 });

  const openDialog = (item: CatalogItem | null) =>
    setDialog((d) => ({ open: true, item, key: d.key + 1 }));

  const filtered = items.filter((i) => i.label.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <>
      <PageHeader
        title="Catalogue"
        description="Tes prestations et leurs tarifs. L'IA ne propose que des lignes issues de ce catalogue."
        actions={
          <Button onClick={() => openDialog(null)}>
            <Plus className="size-4" />
            Nouvelle prestation
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorAlert error={error} title="Impossible de charger le catalogue" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucune prestation"
          description="Ajoute tes prestations habituelles avec leur prix : c'est la base de tous tes devis."
          action={
            <Button onClick={() => openDialog(null)}>
              <Plus className="size-4" />
              Ajouter une prestation
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une prestation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune prestation ne correspond à « {search} ».</p>
          ) : (
            <CatalogTable items={filtered} onEdit={openDialog} />
          )}
        </div>
      )}

      <CatalogItemDialog
        key={dialog.key}
        open={dialog.open}
        item={dialog.item}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}