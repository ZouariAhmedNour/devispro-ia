import { describe, it, expect } from "vitest";
import { parseEurosToCents, centsToInput } from "./money";

describe("parseEurosToCents", () => {
  it("accepte les formats usuels", () => {
    expect(parseEurosToCents("35")).toBe(3500);
    expect(parseEurosToCents("35,5")).toBe(3550);
    expect(parseEurosToCents("35.10")).toBe(3510);
    expect(parseEurosToCents(" 1 234,56 ")).toBe(123456);
  });

  it("rejette les saisies invalides", () => {
    expect(parseEurosToCents("")).toBeNull();
    expect(parseEurosToCents("abc")).toBeNull();
    expect(parseEurosToCents("-3")).toBeNull();
    expect(parseEurosToCents("1,234")).toBeNull(); // 3 décimales
    expect(parseEurosToCents("12,3,4")).toBeNull();
  });
});

describe("centsToInput", () => {
  it("formate pour un champ de saisie", () => {
    expect(centsToInput(3550)).toBe("35,50");
    expect(centsToInput(4000)).toBe("40,00");
  });
});