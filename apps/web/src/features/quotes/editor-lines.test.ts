import { describe, it, expect } from "vitest";
import type { CatalogItem } from "@/features/catalog/api";
import { lineFromCatalog, parseDecimal, toCalc } from "./editor-lines";

const ITEM = {
  id: "item-1",
  company_id: "company-1",
  label: "Pose carrelage sol",
  unit: "m²",
  unit_price_cents: 3500,
  vat_rate: 10,
  active: true,
  created_at: "",
} as CatalogItem;

describe("parseDecimal", () => {
  it("lit les nombres à la française", () => {
    expect(parseDecimal("12,5")).toBe(12.5);
    expect(parseDecimal(" 1 000,5 ")).toBe(1000.5);
  });
  it("renvoie null pour une saisie vide ou invalide", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });
});

describe("lineFromCatalog", () => {
  it("reprend le prix et la TVA du catalogue, et ajoute la note au libellé", () => {
    const line = lineFromCatalog(ITEM, 12, "salle de bain");
    expect(line.label).toBe("Pose carrelage sol (salle de bain)");
    expect(line.price).toBe("35,00");
    expect(line.quantity).toBe("12");
    expect(line.vatRate).toBe(10);
  });
});

describe("toCalc", () => {
  it("convertit une ligne valide pour le calcul", () => {
    expect(toCalc(lineFromCatalog(ITEM, 12))).toEqual({
      quantity: 12,
      unitPriceCents: 3500,
      vatRate: 10,
      discountPercent: 0,
    });
  });
  it("renvoie null pour une quantité, un prix ou une remise invalides", () => {
    const line = lineFromCatalog(ITEM, 1);
    expect(toCalc({ ...line, quantity: "0" })).toBeNull();
    expect(toCalc({ ...line, price: "abc" })).toBeNull();
    expect(toCalc({ ...line, discount: "120" })).toBeNull();
  });
});