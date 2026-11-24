import { FunctionsHttpError } from "@supabase/supabase-js";
import { QuoteDraftSchema, type QuoteDraft } from "@devispro/shared";
import { supabase } from "./supabase";

/** Appelle l'Edge Function. Le jeton de l'utilisateur est envoyé automatiquement. */
export async function generateQuoteDraft(transcript: string): Promise<QuoteDraft> {
  const { data, error } = await supabase.functions.invoke("generate-quote", {
    body: { transcript },
  });

  if (error) {
    // Récupère le message d'erreur renvoyé par la fonction ({ error: "..." })
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status;
      const payload = await error.context.json().catch(() => null);
      const message = payload?.error ?? payload?.message ?? payload?.msg;
      throw new Error(message ? `${message} (HTTP ${status})` : `Erreur du service d'IA (HTTP ${status})`);
    }
    throw error;
  }

  // On ne fait pas confiance aveuglément à la réponse : validation Zod côté client aussi
  return QuoteDraftSchema.parse(data);
}