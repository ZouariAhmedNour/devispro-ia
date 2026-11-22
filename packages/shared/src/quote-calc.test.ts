import { describe, it, expect } from "vitest";
import {
  computeQuoteTotals,
  lineHtCents,
  formatEuros,
  type QuoteLineCalcInput,
} from "./index";

// pour tester volontairement des entrées invalides sans casser le typecheck
const invalid = (line: unknown) => line as QuoteLineCalcInput;

describe("lineHtCents", () => {
  it("multiplie quantité et prix unitaire", () => {
    expect(lineHtCents({ quantity: 12, unitPriceCents: 3500, vatRate: 10 })).toBe(42000);
  });

  it("gère les quantités décimales (12,5 m²)", () => {
    expect(lineHtCents({ quantity: 12.5, unitPriceCents: 3500, vatRate: 10 })).toBe(43750);
  });

  it("arrondit le demi-centime au-dessus", () => {
    expect(lineHtCents({ quantity: 1.5, unitPriceCents: 3, vatRate: 20 })).toBe(5); // 4,5 -> 5
    expect(lineHtCents({ quantity: 0.5, unitPriceCents: 1, vatRate: 20 })).toBe(1); // 0,5 -> 1
  });

  it("applique une remise en %", () => {
    expect(
      lineHtCents({ quantity: 1, unitPriceCents: 10000, vatRate: 20, discountPercent: 10 }),
    ).toBe(9000);
  });

  it("arrondit après remise", () => {
    // 3 × 3,33 € = 9,99 € ; -15 % = 8,4915 € -> 8,49 €
    expect(
      lineHtCents({ quantity: 3, unitPriceCents: 333, vatRate: 20, discountPercent: 15 }),
    ).toBe(849);
  });

  it("rejette les entrées invalides", () => {
    expect(() => lineHtCents(invalid({ quantity: 0, unitPriceCents: 100, vatRate: 20 }))).toThrow();
    expect(() => lineHtCents(invalid({ quantity: 1, unitPriceCents: -1, vatRate: 20 }))).toThrow();
    expect(() => lineHtCents(invalid({ quantity: 1, unitPriceCents: 100, vatRate: 15 }))).toThrow();
    expect(() =>
      lineHtCents(invalid({ quantity: 1, unitPriceCents: 100, vatRate: 20, discountPercent: 120 })),
    ).toThrow();
  });
});

describe("computeQuoteTotals", () => {
  it("calcule le devis de démo (salle de bain Mme Durand)", () => {
    const totals = computeQuoteTotals([
      { quantity: 12, unitPriceCents: 1500, vatRate: 10 }, // dépose
      { quantity: 12, unitPriceCents: 3500, vatRate: 10 }, // pose
      { quantity: 1, unitPriceCents: 4000, vatRate: 20 },  // déplacement
    ]);

    expect(totals.lineHtCents).toEqual([18000, 42000, 4000]);
    expect(totals.totalHtCents).toBe(64000);
    expect(totals.vatByRate).toEqual([
      { rate: 10, baseCents: 60000, vatCents: 6000 },
      { rate: 20, baseCents: 4000, vatCents: 800 },
    ]);
    expect(totals.totalVatCents).toBe(6800);
    expect(totals.totalTtcCents).toBe(70800);
  });

  it("calcule la TVA par taux, pas ligne par ligne", () => {
    // 3 lignes à 0,05 € HT, TVA 10 %
    // ligne par ligne : 3 × arrondi(0,5) = 3 centimes -> faux
    // par taux : arrondi(15 × 10 %) = arrondi(1,5) = 2 centimes -> juste
    const totals = computeQuoteTotals([
      { quantity: 1, unitPriceCents: 5, vatRate: 10 },
      { quantity: 1, unitPriceCents: 5, vatRate: 10 },
      { quantity: 1, unitPriceCents: 5, vatRate: 10 },
    ]);
    expect(totals.totalVatCents).toBe(2);
  });

  it("gère le taux réduit de 5,5 %", () => {
    const totals = computeQuoteTotals([{ quantity: 1, unitPriceCents: 100, vatRate: 5.5 }]);
    expect(totals.totalVatCents).toBe(6); // 5,5 centimes -> 6
    expect(totals.totalTtcCents).toBe(106);
  });

  it("renvoie des zéros pour un devis vide", () => {
    expect(computeQuoteTotals([])).toEqual({
      lineHtCents: [],
      totalHtCents: 0,
      vatByRate: [],
      totalVatCents: 0,
      totalTtcCents: 0,
    });
  });
});

describe("formatEuros", () => {
  it("formate en euros à la française", () => {
    // Intl utilise des espaces insécables : on les normalise pour comparer
    expect(formatEuros(70800).replace(/\s/g, " ")).toBe("708,00 €");
    expect(formatEuros(123456).replace(/\s/g, " ")).toBe("1 234,56 €");
  });
});