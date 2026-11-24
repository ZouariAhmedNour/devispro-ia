import { describe, it, expect } from "vitest";
import { QuoteDraftSchema } from "./ai";

describe("QuoteDraftSchema", () => {
  it("accepte une réponse valide", () => {
    const draft = {
      lines: [{ catalog_item_id: "abc", quantity: 12, note: "salle de bain" }],
      questions: [],
      rejected: [],
    };
    expect(QuoteDraftSchema.parse(draft)).toEqual(draft);
  });

  it("rejette une quantité nulle et une réponse incomplète", () => {
    expect(() =>
      QuoteDraftSchema.parse({
        lines: [{ catalog_item_id: "abc", quantity: 0, note: "" }],
        questions: [],
        rejected: [],
      }),
    ).toThrow();
    expect(() => QuoteDraftSchema.parse({ lines: [] })).toThrow();
  });
});