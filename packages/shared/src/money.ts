const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** 70800 -> "708,00 €" */
export function formatEuros(cents: number): string {
  return euroFormatter.format(cents / 100);
}

/** "35,50" -> 3550 ; "1 234,56" -> 123456 ; saisie invalide -> null */
export function parseEurosToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** 3550 -> "35,50" (pour pré-remplir un champ de saisie) */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}