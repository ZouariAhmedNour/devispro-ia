import { QuoteDraftSchema, TranscriptionSchema, type QuoteDraft } from "@devispro/shared";
import { supabase } from "./supabase";
import { toFunctionError } from "./functions";

/** Texte -> brouillon de devis. */
export async function generateQuoteDraft(transcript: string): Promise<QuoteDraft> {
  const { data, error } = await supabase.functions.invoke("generate-quote", {
    body: { transcript },
  });
  if (error) throw await toFunctionError(error);
  return QuoteDraftSchema.parse(data);
}

/** Audio -> texte : dépôt dans Storage (dossier de l'entreprise), puis transcription. */
export async function transcribeRecording(audio: Blob, companyId: string): Promise<string> {
  const extension = audio.type.includes("mp4") ? "mp4" : "webm";
  const path = `${companyId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(path, audio, { contentType: audio.type.split(";")[0] });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.functions.invoke("transcribe", { body: { path } });
  if (error) throw await toFunctionError(error);
  return TranscriptionSchema.parse(data).text;
}