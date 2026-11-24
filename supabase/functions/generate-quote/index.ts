import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";
import { generateDraft, LlmOutputError, type CatalogEntry } from "./logic.ts";
import { createOpenAiCompatibleClient, LlmError } from "./llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const RequestSchema = z.object({
  transcript: z.string().trim().min(3, "Texte trop court").max(4000, "Texte trop long"),
});

Deno.serve(async (req) => {
  // Pré-requête CORS envoyée par le navigateur
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  // 1. Authentification
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);
  const token = authorization.slice("Bearer ".length);

  const apiKey = Deno.env.get("LLM_API_KEY");
  if (!apiKey) return json({ error: "LLM_API_KEY manquante côté serveur" }, 500);

  // 2. Validation de la requête
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps JSON invalide" }, 400);
  }
  const input = RequestSchema.safeParse(body);
  if (!input.success) {
    return json({ error: input.error.issues[0]?.message ?? "Requête invalide" }, 400);
  }

  // 3. Client Supabase avec le jeton de l'utilisateur : la RLS s'applique
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Session invalide" }, 401);

  // Catalogue de SON entreprise uniquement (filtré par la RLS)
  const { data: catalog, error: catalogError } = await supabase
    .from("catalog_items")
    .select("id, label, unit, unit_price_cents")
    .eq("active", true)
    .order("label");

  if (catalogError) return json({ error: catalogError.message }, 500);
  if (!catalog || catalog.length === 0) {
    return json({ error: "Ton catalogue est vide : ajoute d'abord des prestations." }, 400);
  }

  // 4. Appel au LLM + validation
  const llm = createOpenAiCompatibleClient({
    baseUrl: Deno.env.get("LLM_BASE_URL") ?? "https://api.groq.com/openai/v1",
    apiKey,
    model: Deno.env.get("LLM_MODEL") ?? "openai/gpt-oss-20b",
  });

  try {
    const draft = await generateDraft(input.data.transcript, catalog as CatalogEntry[], llm);
    return json(draft);
  } catch (err) {
    console.error(err);
    if (err instanceof LlmOutputError) {
      return json({ error: "L'IA a renvoyé une réponse inexploitable, réessaie." }, 502);
    }
    if (err instanceof LlmError) {
      return json({ error: "Le service d'IA est indisponible, réessaie dans un instant." }, 502);
    }
    return json({ error: "Erreur interne" }, 500);
  }
});