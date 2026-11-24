import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toMessage } from "@/lib/errors";
import {
  createCatalogItem,
  deleteCatalogItem,
  listCatalogItems,
  updateCatalogItem,
  type CatalogItem,
  type CatalogItemInput,
} from "./api";

/** Clé de cache : toutes les listes du catalogue la partagent. */
export const catalogKeys = { all: ["catalog-items"] as const };

export function useCatalogItems() {
  return useQuery({ queryKey: catalogKeys.all, queryFn: listCatalogItems });
}

/** Création si pas d'id, modification sinon. */
export function useSaveCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CatalogItemInput }) =>
      id ? updateCatalogItem(id, input) : createCatalogItem(input),
    onSuccess: (_data, { id }) => {
      toast.success(id ? "Prestation modifiée" : "Prestation ajoutée");
      return queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    },
    onError: (error) => toast.error(toMessage(error)),
  });
}

export function useToggleCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: CatalogItem) => updateCatalogItem(item.id, { active: !item.active }),
    onSuccess: (_data, item) => {
      toast.success(item.active ? "Prestation désactivée" : "Prestation réactivée");
      return queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    },
    onError: (error) => toast.error(toMessage(error)),
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCatalogItem(id),
    onSuccess: () => {
      toast.success("Prestation supprimée");
      return queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    },
    onError: (error) => toast.error(toMessage(error)),
  });
}