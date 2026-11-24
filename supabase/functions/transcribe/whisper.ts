export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionError";
  }
}

export async function transcribeWithWhisper(
  audio: Blob,
  filename: string,
  config: { baseUrl: string; apiKey: string; model: string },
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", config.model);
  form.append("language", "fr");
  form.append("response_format", "json");
  form.append("temperature", "0");

  const response = await fetchFn(`${config.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: form,
  });

  if (!response.ok) {
    throw new TranscriptionError(`Whisper HTTP ${response.status} : ${await response.text()}`);
  }

  const data = await response.json();
  if (typeof data?.text !== "string") throw new TranscriptionError("Transcription vide");
  return data.text.trim();
}