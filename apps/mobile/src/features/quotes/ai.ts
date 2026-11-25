import * as Crypto from "expo-crypto";
import { QuoteDraftSchema, TranscriptionSchema, type QuoteDraft } from "@devispro/shared";
import { supabase } from "@/lib/supabase";
import { toFunctionError } from "@/lib/functions";

export async function generateQuoteDraft(transcript: string): Promise<QuoteDraft> {
  const { data, error } = await supabase.functions.invoke("generate-quote", {
    body: { transcript },
  });
  if (error) throw await toFunctionError(error);
  return QuoteDraftSchema.parse(data);
}

/** Fichier audio local (m4a) -> Storage (dossier de l'entreprise) -> transcription. */
export async function transcribeRecording(uri: string, companyId: string): Promise<string> {
  const path = `${companyId}/${Crypto.randomUUID().toLowerCase()}.m4a`;
  const audio = await fetch(uri).then((res) => res.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(path, audio, { contentType: "audio/m4a" });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.functions.invoke("transcribe", { body: { path } });
  if (error) throw await toFunctionError(error);
  return TranscriptionSchema.parse(data).text;
}