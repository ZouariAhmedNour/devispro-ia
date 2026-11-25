import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDraftQuote, deleteQuote, listQuotes, saveQuote, type SaveQuoteInput } from "./api";
import { generateQuoteDraft } from "./ai";

export const quoteKeys = {
  all: ["quotes"] as const,
  list: () => [...quoteKeys.all, "list"] as const,
};

export function useQuotes() {
  return useQuery({ queryKey: quoteKeys.list(), queryFn: listQuotes });
}

export function useGenerateDraft() {
  return useMutation({ mutationFn: (transcript: string) => generateQuoteDraft(transcript) });
}

/** Crée le devis puis l'enregistre ; si l'enregistrement échoue, le brouillon vide est supprimé. */
export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<SaveQuoteInput, "id">) => {
      const id = await createDraftQuote();
      try {
        await saveQuote({ ...input, id });
      } catch (error) {
        await deleteQuote(id).catch(() => undefined);
        throw error;
      }
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: quoteKeys.all }),
  });
}