import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toMessage } from "@/lib/errors";
import { createDraftQuote, deleteQuote, getQuote, listQuotes, saveQuote } from "./api";
import { generateQuoteDraft } from "./ai";
import { generateQuotePdf } from "./pdf";

export const quoteKeys = {
  all: ["quotes"] as const,
  list: () => [...quoteKeys.all, "list"] as const,
  detail: (id: string) => [...quoteKeys.all, "detail", id] as const,
};

export function useQuotes() {
  return useQuery({ queryKey: quoteKeys.list(), queryFn: listQuotes });
}

export function useQuote(id: string) {
  return useQuery({ queryKey: quoteKeys.detail(id), queryFn: () => getQuote(id), retry: false });
}

export function useCreateDraftQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createDraftQuote(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: quoteKeys.list() }),
    onError: (error) => toast.error(toMessage(error)),
  });
}

export function useSaveQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveQuote,
    onSuccess: () => {
      toast.success("Devis enregistré", { description: "Totaux vérifiés par le serveur." });
      return queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    },
    onError: (error) => toast.error("Enregistrement refusé", { description: toMessage(error) }),
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuote(id),
    onSuccess: (_data, id) => {
      toast.success("Devis supprimé");
      queryClient.removeQueries({ queryKey: quoteKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: quoteKeys.list() });
    },
    onError: (error) => toast.error(toMessage(error)),
  });
}

export function useGenerateDraft() {
  return useMutation({
    mutationFn: (transcript: string) => generateQuoteDraft(transcript),
    onError: (error) => toast.error("Génération impossible", { description: toMessage(error) }),
  });
}

export function useQuotePdf() {
  return useMutation({
    mutationFn: (quoteId: string) => generateQuotePdf(quoteId),
    onError: (error) => toast.error("PDF impossible", { description: toMessage(error) }),
  });
}