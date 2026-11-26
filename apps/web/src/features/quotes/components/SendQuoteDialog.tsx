import { useState } from "react";
import { AlertTriangle, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { buildQuoteMessage, quoteEmailSubject } from "@devispro/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/features/clients/api";
import { useUpdateQuoteStatus } from "../hooks";
import type { QuoteStatus } from "../status";

export function SendQuoteDialog({
    open,
    onOpenChange,
    quoteId,
    url,
    client,
    companyName,
    status,
    onSent,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteId: string;
    url: string;
    client: Client | null;
    companyName: string;
    status: QuoteStatus;
    onSent: () => void;
}) {
    const updateStatus = useUpdateQuoteStatus(quoteId);
    const [message, setMessage] = useState(() =>
        buildQuoteMessage({ clientName: client?.name, companyName, url }),
    );

    /** Un brouillon envoyé passe au statut « Envoyé ». */
    function markSent() {
        if (status !== "draft") return;
        updateStatus.mutate("sent", {
            onSuccess: () => {
                onSent();
                toast.success("Statut passé à « Envoyé »");
            },
        });
    }

    function openMailClient() {
        const to = encodeURIComponent(client?.email ?? "");
        const subject = encodeURIComponent(quoteEmailSubject(companyName));
        const body = encodeURIComponent(message);
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
        markSent();
    }

    async function copyMessage() {
        await navigator.clipboard.writeText(message);
        toast.success("Message copié", { description: "Colle-le dans un SMS, WhatsApp ou un e-mail." });
        markSent();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Envoyer le devis</DialogTitle>
                    <DialogDescription>
                        Le lien vers le PDF est valable 7 jours. Le client te répondra directement.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-w-0 space-y-4">
                    <div className="space-y-1">
                        <Label>Destinataire</Label>
                        <p className="text-sm">
                            {client ? client.name : "Aucun client"}
                            {client?.email && <span className="text-muted-foreground"> · {client.email}</span>}
                        </p>
                    </div>

                    {!client?.email && (
                        <Alert>
                            <AlertTriangle />
                            <AlertDescription>
                                Ce client n'a pas d'e-mail : copie le message et envoie-le par SMS ou WhatsApp.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            rows={9}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="max-h-72 w-full min-w-0 resize-none text-sm [field-sizing:fixed] [overflow-wrap:anywhere]"
                        />          </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={copyMessage}>
                        <Copy className="size-4" />
                        Copier le message
                    </Button>
                    <Button onClick={openMailClient}>
                        <Mail className="size-4" />
                        Ouvrir dans ma messagerie
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}