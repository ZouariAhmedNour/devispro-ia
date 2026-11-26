import { PDFDocument, StandardFonts, rgb, type PDFFont } from "npm:pdf-lib@1.17.1";

// ---------- Types ----------
export type PdfLine = {
  label: string;
  unit: string;
  quantity: number;
  unit_price_cents: number;
  vat_rate: number;
  discount_percent: number;
};

export type PdfQuoteData = {
  id: string;
  createdAt: string;
  notes: string | null;
  company: { name: string; siret: string | null; address: string | null };
  client: { name: string; email: string | null; phone: string | null; address: string | null } | null;
  lines: PdfLine[];
  totals: { ht: number; vat: number; ttc: number };
};

// ---------- Calculs (mêmes règles que shared et SQL) ----------
export function lineHt(l: PdfLine): number {
  const gross = Math.round((Math.round(l.quantity * 100) * l.unit_price_cents) / 100);
  if (!l.discount_percent) return gross;
  return Math.round((gross * (10000 - Math.round(l.discount_percent * 100))) / 10000);
}

export function vatBreakdown(lines: PdfLine[]) {
  const baseByRate = new Map<number, number>();
  for (const l of lines) baseByRate.set(l.vat_rate, (baseByRate.get(l.vat_rate) ?? 0) + lineHt(l));
  return [...baseByRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, base]) => ({ rate, base, vat: Math.round((base * Math.round(rate * 100)) / 10000) }));
}

// ---------- Formatage ----------
/** Formatage manuel : Intl insère des espaces insécables que les polices PDF standard ne savent pas dessiner. */
export function formatEuro(cents: number): string {
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${cents < 0 ? "-" : ""}${euros},${String(abs % 100).padStart(2, "0")} €`;
}

export const formatNumber = (n: number) => String(n).replace(".", ",");

export const quoteNumber = (id: string, createdAt: string) =>
  `DEV-${new Date(createdAt).getFullYear()}-${id.slice(0, 6).toUpperCase()}`;

const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

/** Les polices PDF standard ne connaissent que l'encodage WinAnsi : on remplace le reste. */
const WINANSI_EXTRA = new Set("€‘’“”–—…•œŒ");
export function toWinAnsi(text: string): string {
  return [...text.replace(/[\u202f\u00a0]/g, " ")]
    .map((c) => (c.charCodeAt(0) <= 0xff || WINANSI_EXTRA.has(c) ? c : "?"))
    .join("");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = toWinAnsi(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

// ---------- Mise en page ----------
const W = 595.28; // A4
const H = 841.89;
const M = 50; // marges
const DARK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.39, 0.45, 0.55);
const BORDER = rgb(0.89, 0.91, 0.94);
const HEADER_BG = rgb(0.95, 0.96, 0.98);

// Colonnes du tableau (bord droit pour les nombres)
const COL = { label: M + 6, labelWidth: 220, qty: M + 280, unit: M + 288, price: M + 385, vat: M + 430, total: W - M - 6 };

export async function buildQuotePdf(d: PdfQuoteData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const number = quoteNumber(d.id, d.createdAt);
  pdf.setTitle(`Devis ${number}`);
  pdf.setAuthor(d.company.name);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([W, H]);
  let y = H - M;

  type Opts = { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb> };
  const text = (s: string, x: number, yy: number, o: Opts = {}) =>
    page.drawText(toWinAnsi(s), { x, y: yy, size: o.size ?? 9.5, font: o.f ?? font, color: o.color ?? DARK });
  const textRight = (s: string, xRight: number, yy: number, o: Opts = {}) => {
    const size = o.size ?? 9.5;
    const f = o.f ?? font;
    text(s, xRight - f.widthOfTextAtSize(toWinAnsi(s), size), yy, o);
  };

  // --- En-tête : entreprise (gauche) / devis (droite) ---
  text(d.company.name, M, y, { size: 16, f: bold });
  let leftY = y - 18;
  for (const s of [d.company.address, d.company.siret ? `SIRET : ${d.company.siret}` : null]) {
    if (s) {
      text(s, M, leftY, { color: MUTED });
      leftY -= 12;
    }
  }

  const created = new Date(d.createdAt);
  const validUntil = new Date(created.getTime() + 30 * 24 * 3600 * 1000);
  textRight("DEVIS", W - M, y, { size: 22, f: bold });
  textRight(`N° ${number}`, W - M, y - 20, { f: bold });
  textRight(`Date : ${formatDate(created)}`, W - M, y - 33, { color: MUTED });
  textRight(`Valable jusqu'au : ${formatDate(validUntil)}`, W - M, y - 45, { color: MUTED });

  y = Math.min(leftY, y - 45) - 25;

  // --- Bloc client ---
  const boxX = W / 2;
  const clientLines = d.client
    ? [d.client.address, d.client.email, d.client.phone].filter((s): s is string => Boolean(s))
    : [];
  const boxH = 30 + clientLines.length * 12;
  page.drawRectangle({ x: boxX, y: y - boxH, width: W - M - boxX, height: boxH + 8, borderColor: BORDER, borderWidth: 1 });
  text("CLIENT", boxX + 10, y - 6, { size: 7.5, f: bold, color: MUTED });
  text(d.client?.name ?? "Client non renseigné", boxX + 10, y - 20, { size: 11, f: bold });
  clientLines.forEach((s, i) => text(s, boxX + 10, y - 34 - i * 12, { color: MUTED }));
  y -= boxH + 28;

  // --- Objet ---
  if (d.notes) {
    text("Objet :", M, y, { f: bold });
    const objLines = wrapText(d.notes, font, 9.5, W - 2 * M - 45);
    objLines.forEach((s, i) => text(s, M + 40, y - i * 12));
    y -= objLines.length * 12 + 14;
  }

  // --- Tableau des lignes ---
  const drawTableHeader = () => {
    page.drawRectangle({ x: M, y: y - 6, width: W - 2 * M, height: 20, color: HEADER_BG });
    const o = { size: 8, f: bold, color: MUTED };
    text("DÉSIGNATION", COL.label, y, o);
    textRight("QTÉ", COL.qty, y, o);
    text("UNITÉ", COL.unit, y, o);
    textRight("PU HT", COL.price, y, o);
    textRight("TVA", COL.vat, y, o);
    textRight("TOTAL HT", COL.total, y, o);
    y -= 22;
  };
  drawTableHeader();

  for (const l of d.lines) {
    const labelLines = wrapText(l.label, font, 9.5, COL.labelWidth);
    const rowH = labelLines.length * 12 + 6;
    if (y - rowH < 170) {
      page = pdf.addPage([W, H]);
      y = H - M;
      drawTableHeader();
    }
    labelLines.forEach((s, i) => text(s, COL.label, y - i * 12));
    textRight(formatNumber(l.quantity), COL.qty, y);
    text(l.unit, COL.unit, y, { color: MUTED });
    textRight(formatEuro(l.unit_price_cents), COL.price, y);
    textRight(`${formatNumber(l.vat_rate)} %`, COL.vat, y, { color: MUTED });
    textRight(formatEuro(lineHt(l)), COL.total, y, { f: bold });
    if (l.discount_percent) {
      text(`Remise ${formatNumber(l.discount_percent)} %`, COL.label, y - labelLines.length * 12, { size: 8, color: MUTED });
    }
    y -= rowH + (l.discount_percent ? 10 : 0);
    page.drawLine({ start: { x: M, y: y + 8 }, end: { x: W - M, y: y + 8 }, thickness: 0.5, color: BORDER });
  }

  // --- Totaux ---
  if (y < 200) {
    page = pdf.addPage([W, H]);
    y = H - M;
  }
  y -= 10;
  const totalsX = W - M - 200;
  const totalRow = (label: string, value: string, strong = false) => {
    text(label, totalsX, y, { f: strong ? bold : font, size: strong ? 11 : 9.5, color: strong ? DARK : MUTED });
    textRight(value, W - M, y, { f: bold, size: strong ? 11 : 9.5 });
    y -= strong ? 18 : 14;
  };
  totalRow("Total HT", formatEuro(d.totals.ht));
  for (const v of vatBreakdown(d.lines)) {
    totalRow(`TVA ${formatNumber(v.rate)} % (sur ${formatEuro(v.base)})`, formatEuro(v.vat));
  }
  page.drawLine({ start: { x: totalsX, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 1, color: DARK });
  y -= 6;
  totalRow("Total TTC", formatEuro(d.totals.ttc), true);

  // --- Mentions et signature ---
  y -= 16;
  for (const s of [
    "Devis gratuit, valable 30 jours à compter de sa date d'émission.",
    "Prix exprimés en euros. Les travaux débuteront après acceptation du devis.",
  ]) {
    text(s, M, y, { size: 8.5, color: MUTED });
    y -= 12;
  }
  y -= 10;
  page.drawRectangle({ x: W - M - 220, y: y - 60, width: 220, height: 70, borderColor: BORDER, borderWidth: 1 });
  text("Bon pour accord", W - M - 210, y - 4, { f: bold, size: 9 });
  text("Date et signature du client :", W - M - 210, y - 17, { size: 8.5, color: MUTED });

  // --- Pied de page sur chaque page ---
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const footer = toWinAnsi(
      `${d.company.name}${d.company.siret ? ` · SIRET ${d.company.siret}` : ""} · Devis ${number} · Page ${i + 1}/${pages.length}`,
    );
    p.drawText(footer, {
      x: (W - font.widthOfTextAtSize(footer, 7.5)) / 2,
      y: 25,
      size: 7.5,
      font,
      color: MUTED,
    });
  });

 return await pdf.save({ useObjectStreams: false });}