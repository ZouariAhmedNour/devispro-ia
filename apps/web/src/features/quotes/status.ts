import type { Enums } from "@devispro/shared";

export type QuoteStatus = Enums<"quote_status">;

export const QUOTE_STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "rejected"];

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  rejected: "Refusé",
};

export const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  sent: "border-blue-200 bg-blue-50 text-blue-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};