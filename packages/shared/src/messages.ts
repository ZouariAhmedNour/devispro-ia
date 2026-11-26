export const LINK_VALIDITY_DAYS = 7;

export function quoteEmailSubject(companyName: string): string {
  return `Votre devis – ${companyName}`;
}

export function buildQuoteMessage(params: {
  clientName?: string | null;
  companyName: string;
  url: string;
}): string {
  const greeting = params.clientName ? `Bonjour ${params.clientName},` : "Bonjour,";
  return [
    greeting,
    "",
    `Veuillez trouver votre devis en suivant ce lien (valable ${LINK_VALIDITY_DAYS} jours) :`,
    params.url,
    "",
    "N'hésitez pas à me contacter pour toute question.",
    "",
    "Cordialement,",
    params.companyName,
  ].join("\n");
}