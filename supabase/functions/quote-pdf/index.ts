import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";
import { buildQuotePdf, vatBreakdown, type PdfLine, type PdfQuoteData } from "./pdf.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

const RequestSchema = z.object({ quoteId: z.guid() });
const LINK_VALIDITY_SECONDS = 7 * 24 * 3600; // 7 jours
/** En local, l'Edge Function voit Supabase sous le nom Docker "kong" : on le remplace par l'adresse joignable depuis le navigateur. */
function toPublicUrl(url: string): string {
  return url.replace(/^http:\/\/kong:8000/, "http://127.0.0.1:54321");
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);
  const token = authorization.slice("Bearer ".length);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps JSON invalide" }, 400);
  }
  const input = RequestSchema.safeParse(body);
  if (!input.success) return json({ error: "Identifiant de devis invalide" }, 400);

  // Client avec le jeton de l'utilisateur : la RLS (tables + Storage) s'applique
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Session invalide" }, 401);

  // 1. Données du devis (uniquement si le devis appartient à son entreprise)
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select(
      "id, company_id, created_at, notes, total_ht_cents, total_vat_cents, total_ttc_cents, clients(name, email, phone, address), quote_lines(label, unit, quantity, unit_price_cents, vat_rate, discount_percent, position)",
    )
    .eq("id", input.data.quoteId)
    .order("position", { referencedTable: "quote_lines" })
    .single();
  if (quoteError || !quote) return json({ error: "Devis introuvable" }, 404);

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("name, siret, address")
    .single();
  if (companyError || !company) return json({ error: "Entreprise introuvable" }, 404);

  const lines = quote.quote_lines as PdfLine[];
  if (lines.length === 0) return json({ error: "Le devis ne contient aucune ligne." }, 400);
// Sans types générés, supabase-js ne sait pas que la relation renvoie UN client : on normalise
  const rawClient = quote.clients as unknown;
  const client = (Array.isArray(rawClient) ? rawClient[0] ?? null : rawClient ?? null) as PdfQuoteData["client"];
  // 2. Cohérence : le PDF doit correspondre aux totaux vérifiés par save_quote
  const breakdown = vatBreakdown(lines);
  const ht = breakdown.reduce((s, v) => s + v.base, 0);
  const vat = breakdown.reduce((s, v) => s + v.vat, 0);
  if (ht + vat !== quote.total_ttc_cents) {
    return json({ error: "Totaux incohérents : enregistre le devis avant de générer le PDF." }, 409);
  }

  // 3. Génération
  const bytes = await buildQuotePdf({
    id: quote.id,
    createdAt: quote.created_at,
    notes: quote.notes,
    company,
    client,
    lines,
    totals: { ht: quote.total_ht_cents, vat: quote.total_vat_cents, ttc: quote.total_ttc_cents },
  });

  // 4. Stockage privé + lien signé
  const path = `${quote.company_id}/${quote.id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("quotes")
    .upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    console.error(uploadError);
    return json({ error: "Impossible d'enregistrer le PDF" }, 500);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("quotes")
    .createSignedUrl(path, LINK_VALIDITY_SECONDS);
  if (signError || !signed) return json({ error: "Impossible de créer le lien" }, 500);

  return json({ url: toPublicUrl(signed.signedUrl), path, expiresInSeconds: LINK_VALIDITY_SECONDS });
});