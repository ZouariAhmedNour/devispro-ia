import { z } from "zod";

/** Ce que renvoie l'Edge Function generate-quote. */
export const QuoteDraftSchema = z.object({
  lines: z.array(
    z.object({
      catalog_item_id: z.string(),
      quantity: z.number().positive(),
      note: z.string(),
    }),
  ),
  questions: z.array(z.string()),
  rejected: z.array(z.object({ ref: z.string(), reason: z.string() })),
});

export type QuoteDraft = z.infer<typeof QuoteDraftSchema>;

/** Ce que renvoie l'Edge Function transcribe. */
export const TranscriptionSchema = z.object({ text: z.string() });