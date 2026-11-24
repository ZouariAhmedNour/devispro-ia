import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toMessage } from "@/lib/errors";

export function ErrorAlert({
  error,
  title = "Une erreur est survenue",
}: {
  error: unknown;
  title?: string;
}) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{toMessage(error)}</AlertDescription>
    </Alert>
  );
}