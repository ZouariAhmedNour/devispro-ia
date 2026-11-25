import type { Enums } from "./database.types";

export type QuoteStatus = Enums<"quote_status">;

export const QUOTE_STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "rejected"];

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  rejected: "Refusé",
};