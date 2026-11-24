import { FunctionsHttpError } from "@supabase/supabase-js";

/** Transforme une erreur d'Edge Function en Error lisible (message + code HTTP). */
export async function toFunctionError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    const status = error.context.status;
    const payload = await error.context.json().catch(() => null);
    const message = payload?.error ?? payload?.message ?? payload?.msg;
    return new Error(message ? `${message} (HTTP ${status})` : `Erreur du service (HTTP ${status})`);
  }
  return error instanceof Error ? error : new Error("Erreur inconnue");
}