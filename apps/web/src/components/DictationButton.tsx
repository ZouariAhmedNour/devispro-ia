import { useRef, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { transcribeRecording } from "../lib/ai";
import { toMessage } from "../lib/errors";

type State = "idle" | "recording" | "transcribing";

/** Bouton micro : enregistre, envoie à la transcription, renvoie le texte. */
export default function DictationButton({ onText }: { onText: (text: string) => void }) {
  const { profile } = useAuth();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Chrome/Edge/Firefox : webm ; Safari : mp4
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop()); // libère le micro
        if (!profile) return;
        setState("transcribing");
        try {
          const audio = new Blob(chunksRef.current, { type: mimeType });
          const text = await transcribeRecording(audio, profile.companyId);
          if (text) onText(text);
          else setError("Rien n'a été compris, réessaie en parlant plus près du micro.");
        } catch (err) {
          setError(toMessage(err));
        } finally {
          setState("idle");
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      setError("Accès au micro refusé ou indisponible.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  return (
    <div className="flex items-center gap-2">
      {state === "recording" ? (
        <button
          type="button"
          onClick={stop}
          className="animate-pulse rounded bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          ⏹ Arrêter la dictée
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={state === "transcribing" || !profile}
          className="rounded border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50"
        >
          {state === "transcribing" ? "Transcription…" : "🎤 Dicter"}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}