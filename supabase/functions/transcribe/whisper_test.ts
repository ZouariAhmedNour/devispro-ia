import { assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import { transcribeWithWhisper, TranscriptionError } from "./whisper.ts";

const CONFIG = { baseUrl: "https://api.example.test/v1", apiKey: "test-key", model: "whisper-test" };
const AUDIO = new Blob(["fake audio"], { type: "audio/webm" });

function fakeFetch(response: Response) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn: typeof fetch = (input, init) => {
    calls.push({ url: String(input), init });
    return Promise.resolve(response);
  };
  return { fn, calls };
}

Deno.test("envoie l'audio à Whisper en français et renvoie le texte nettoyé", async () => {
  const { fn, calls } = fakeFetch(new Response(JSON.stringify({ text: "  Salle de bain de 12 m2.  " })));

  const text = await transcribeWithWhisper(AUDIO, "dictee.webm", CONFIG, fn);

  assertEquals(text, "Salle de bain de 12 m2.");
  assertStringIncludes(calls[0].url, "/audio/transcriptions");
  const headers = calls[0].init?.headers as Record<string, string>;
  assertEquals(headers.Authorization, "Bearer test-key");
  const form = calls[0].init?.body as FormData;
  assertEquals(form.get("model"), "whisper-test");
  assertEquals(form.get("language"), "fr");
});

Deno.test("lève une erreur si Whisper répond en erreur", async () => {
  const { fn } = fakeFetch(new Response("rate limit", { status: 429 }));
  await assertRejects(() => transcribeWithWhisper(AUDIO, "dictee.webm", CONFIG, fn), TranscriptionError);
});

Deno.test("lève une erreur si la réponse ne contient pas de texte", async () => {
  const { fn } = fakeFetch(new Response(JSON.stringify({ foo: "bar" })));
  await assertRejects(() => transcribeWithWhisper(AUDIO, "dictee.webm", CONFIG, fn), TranscriptionError);
});