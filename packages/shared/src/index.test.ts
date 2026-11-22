import { describe, it, expect } from "vitest";
import { TvaRateSchema } from "./index";

describe("TvaRateSchema", () => {
  it("accepte 20", () => expect(TvaRateSchema.parse(20)).toBe(20));
  it("rejette 15", () => expect(() => TvaRateSchema.parse(15)).toThrow());
});