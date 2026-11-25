import { assert, assertEquals } from "jsr:@std/assert@1";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { buildQuotePdf, formatEuro, toWinAnsi, vatBreakdown, type PdfLine, type PdfQuoteData } from "./pdf.ts";

const LINES: PdfLine[] = [
  { label: "Dépose ancien carrelage", unit: "m²", quantity: 12, unit_price_cents: 1500, vat_rate: 10, discount_percent: 0 },
  { label: "Pose carrelage sol", unit: "m²", quantity: 12, unit_price_cents: 3500, vat_rate: 10, discount_percent: 0 },
  { label: "Déplacement", unit: "forfait", quantity: 1, unit_price_cents: 4000, vat_rate: 20, discount_percent: 0 },
];

const DATA: PdfQuoteData = {
  id: "aaaaaaaa-0000-0000-0000-0000000000e1",
  createdAt: "2026-11-25T10:00:00Z",
  notes: "Salle de bain, 12 m² au sol",
  company: { name: "Martin Carrelage", siret: "12345678900011", address: "12 rue des Artisans, 69003 Lyon" },
  client: { name: "Mme Durand", email: "durand@client.test", phone: null, address: "8 place Bellecour, 69002 Lyon" },
  lines: LINES,
  totals: { ht: 64000, vat: 6800, ttc: 70800 },
};

Deno.test("formate les montants à la française sans espace insécable", () => {
  assertEquals(formatEuro(70800), "708,00 €");
  assertEquals(formatEuro(123456), "1 234,56 €");
  assertEquals(formatEuro(5), "0,05 €");
});

Deno.test("ventile la TVA par taux comme shared et SQL (devis de démo)", () => {
  assertEquals(vatBreakdown(LINES), [
    { rate: 10, base: 60000, vat: 6000 },
    { rate: 20, base: 4000, vat: 800 },
  ]);
});

Deno.test("remplace les caractères impossibles à dessiner avec les polices standard", () => {
  assertEquals(toWinAnsi("12\u202f000 € ✅"), "12 000 € ?");
  assertEquals(toWinAnsi("Pose carrelage 12 m²"), "Pose carrelage 12 m²");
});

Deno.test("génère un PDF valide d'une page", async () => {
  const bytes = await buildQuotePdf(DATA);
  assertEquals(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-");
  const doc = await PDFDocument.load(bytes);
  assertEquals(doc.getPageCount(), 1);
});

Deno.test("passe à la page suivante quand il y a beaucoup de lignes", async () => {
  const many = Array.from({ length: 45 }, (_, i) => ({ ...LINES[0], label: `Prestation n° ${i + 1}` }));
  const doc = await PDFDocument.load(await buildQuotePdf({ ...DATA, lines: many }));
  assert(doc.getPageCount() >= 2);
});