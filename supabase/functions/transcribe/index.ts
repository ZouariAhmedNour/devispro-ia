import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";
import { transcribeWithWhisper, TranscriptionError } from "./whisper.ts";

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

const RequestSchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webm|mp4|m4a|ogg|mp3|wav)$/, "Chemin audio invalide"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);
  const token = authorization.slice("Bearer ".length);

  const apiKey = Deno.env.get("LLM_API_KEY");
  if (!apiKey) return json({ error: "LLM_API_KEY manquante côté serveur" }, 500);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps JSON invalide" }, 400);
  }
  const input = RequestSchema.safeParse(body);
  if (!input.success) return json({ error: input.error.issues[0]?.message ?? "Requête invalide" }, 400);

  // Client avec le jeton de l'utilisateur : la RLS de Storage s'applique
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Session invalide" }, 401);

  // Téléchargement : refusé si le fichier n'est pas dans le dossier de SON entreprise
  const { data: audio, error: downloadError } = await supabase.storage.from("audio").download(input.data.path);
  if (downloadError || !audio) return json({ error: "Fichier audio introuvable" }, 404);

  try {
    const text = await transcribeWithWhisper(audio, input.data.path.split("/")[1], {
      baseUrl: Deno.env.get("LLM_BASE_URL") ?? "https://api.groq.com/openai/v1",
      apiKey,
      model: Deno.env.get("TRANSCRIBE_MODEL") ?? "whisper-large-v3-turbo",
    });
    return json({ text });
  } catch (err) {
    console.error(err);
    if (err instanceof TranscriptionError) {
      return json({ error: "La transcription a échoué, réessaie." }, 502);
    }
    return json({ error: "Erreur interne" }, 500);
  } finally {
    // Minimisation des données : l'audio est supprimé dès qu'il a servi
    await supabase.storage.from("audio").remove([input.data.path]);
  }
});