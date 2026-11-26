import { describe, it, expect } from "vitest";
import { buildQuoteMessage, quoteEmailSubject } from "./messages";

describe("buildQuoteMessage", () => {
  it("salue le client par son nom et contient le lien", () => {
    const msg = buildQuoteMessage({ clientName: "Mme Durand", companyName: "Martin Carrelage", url: "https://x.test/devis.pdf" });
    expect(msg.startsWith("Bonjour Mme Durand,")).toBe(true);
    expect(msg).toContain("https://x.test/devis.pdf");
    expect(msg.endsWith("Martin Carrelage")).toBe(true);
  });

  it("reste poli sans nom de client", () => {
    const msg = buildQuoteMessage({ clientName: null, companyName: "Martin Carrelage", url: "https://x.test" });
    expect(msg.startsWith("Bonjour,")).toBe(true);
  });
});

describe("quoteEmailSubject", () => {
  it("contient le nom de l'entreprise", () => {
    expect(quoteEmailSubject("Martin Carrelage")).toBe("Votre devis – Martin Carrelage");
  });
});