import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toMessage } from "@/lib/errors";
import { createClient, deleteClient, listClients, updateClient, type ClientInput } from "./api";

export const clientKeys = { all: ["clients"] as const };

export function useClients() {
  return useQuery({ queryKey: clientKeys.all, queryFn: listClients });
}

export function useSaveClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ClientInput }) =>
      id ? updateClient(id, input) : createClient(input),
    onSuccess: (_data, { id }) => {
      toast.success(id ? "Client modifié" : "Client ajouté");
      return queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
    onError: (error) => toast.error(toMessage(error)),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      toast.success("Client supprimé");
      return queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
    onError: (error) => toast.error(toMessage(error)),
  });
}