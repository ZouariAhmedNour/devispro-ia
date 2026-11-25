import { QuotePdfSchema } from "@devispro/shared";
import { supabase } from "@/lib/supabase";
import { toFunctionError } from "@/lib/functions";

/** Génère (ou régénère) le PDF du devis et renvoie un lien signé valable 7 jours. */
export async function generateQuotePdf(quoteId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("quote-pdf", { body: { quoteId } });
  if (error) throw await toFunctionError(error);
  return QuotePdfSchema.parse(data).url;
}