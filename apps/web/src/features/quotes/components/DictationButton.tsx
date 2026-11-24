import { useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { toMessage } from "@/lib/errors";
import { transcribeRecording } from "../ai";

type State = "idle" | "recording" | "transcribing";

/** Bouton micro : enregistre, envoie à la transcription, renvoie le texte. */
export function DictationButton({ onText }: { onText: (text: string) => void }) {
  const { profile } = useAuth();
  const [state, setState] = useState<State>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
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
          else toast.warning("Rien n'a été compris, réessaie en parlant plus près du micro.");
        } catch (err) {
          toast.error("Transcription impossible", { description: toMessage(err) });
        } finally {
          setState("idle");
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      toast.error("Accès au micro refusé ou indisponible.");
    }
  }

  if (state === "recording") {
    return (
      <Button type="button" variant="destructive" className="animate-pulse" onClick={() => recorderRef.current?.stop()}>
        <Square className="size-4" />
        Arrêter
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" onClick={start} disabled={state === "transcribing" || !profile}>
      {state === "transcribing" ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
      {state === "transcribing" ? "Transcription…" : "Dicter"}
    </Button>
  );
}