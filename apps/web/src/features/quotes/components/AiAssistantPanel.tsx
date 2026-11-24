import { useState } from "react";
import { Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { QuoteDraft } from "@devispro/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateDraft } from "../hooks";
import { DictationButton } from "./DictationButton";

export function AiAssistantPanel({
  onDraft,
}: {
  onDraft: (draft: QuoteDraft, transcript: string) => number;
}) {
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [rejected, setRejected] = useState(0);
  const generate = useGenerateDraft();

  function handleGenerate() {
    setQuestions([]);
    setRejected(0);
    generate.mutate(text, {
      onSuccess: (draft) => {
        const added = onDraft(draft, text);
        setQuestions(draft.questions);
        setRejected(draft.rejected.length);
        if (added > 0) toast.success(`${added} ligne(s) ajoutée(s) par l'IA`);
      },
    });
  }

  return (
    <Card className="border-violet-200 bg-violet-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-violet-900">
          <Sparkles className="size-4" />
          Assistant IA
        </CardTitle>
        <CardDescription>
          Décris le chantier ou dicte-le : l'IA choisit dans ton catalogue, les prix restent les tiens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="ex. Salle de bain de 12 m², enlever l'ancien carrelage et poser du carrelage neuf au sol."
          className="bg-background"
        />
        <div className="flex flex-wrap items-center gap-2">
          <DictationButton onText={(t) => setText((current) => (current ? `${current} ${t}` : t))} />
          <Button
            onClick={handleGenerate}
            disabled={generate.isPending || text.trim().length < 3}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Générer les lignes
          </Button>
        </div>

        {questions.length > 0 && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <MessageCircleQuestion />
            <AlertTitle>L'IA a besoin de précisions</AlertTitle>
            <AlertDescription className="text-amber-900">
              <ul className="list-disc pl-5">
                {questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <p className="mt-1 text-xs">Complète ta description, puis relance la génération.</p>
            </AlertDescription>
          </Alert>
        )}

        {rejected > 0 && (
          <p className="text-xs text-muted-foreground">
            {rejected} proposition(s) écartée(s) : absente(s) de ton catalogue.
          </p>
        )}
      </CardContent>
    </Card>
  );
}