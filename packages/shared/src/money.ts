const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** 70800 -> "708,00 €" */
export function formatEuros(cents: number): string {
  return euroFormatter.format(cents / 100);
}