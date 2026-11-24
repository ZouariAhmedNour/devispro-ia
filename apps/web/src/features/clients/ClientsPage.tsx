import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import type { Client } from "./api";
import { useClients } from "./hooks";
import { ClientDialog } from "./components/ClientDialog";
import { ClientsTable } from "./components/ClientsTable";

export default function ClientsPage() {
  const { data: clients = [], isLoading, error } = useClients();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState({ open: false, client: null as Client | null, key: 0 });

  const openDialog = (client: Client | null) =>
    setDialog((d) => ({ open: true, client, key: d.key + 1 }));

  const q = search.trim().toLowerCase();
  const filtered = clients.filter((c) =>
    [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(q)),
  );

  return (
    <>
      <PageHeader
        title="Clients"
        description="Les particuliers et entreprises pour qui tu établis des devis."
        actions={
          <Button onClick={() => openDialog(null)}>
            <Plus className="size-4" />
            Nouveau client
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorAlert error={error} title="Impossible de charger les clients" />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          description="Ajoute ton premier client pour lui préparer un devis."
          action={
            <Button onClick={() => openDialog(null)}>
              <Plus className="size-4" />
              Ajouter un client
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, e-mail, téléphone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun client ne correspond à « {search} ».</p>
          ) : (
            <ClientsTable clients={filtered} onEdit={openDialog} />
          )}
        </div>
      )}

      <ClientDialog
        key={dialog.key}
        open={dialog.open}
        client={dialog.client}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}