import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { Hammer, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export default function LoginPage() {
  const { session } = useAuth();
  const [email, setEmail] = useState("artisan.a@demo.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/devis" replace />;

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError("E-mail ou mot de passe incorrect.");
  }

  async function handleMagicLink() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
    });
    setBusy(false);
    if (error) setError(error.message);
    else toast.success("Lien envoyé !", { description: `Consulte la boîte mail de ${email}.` });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Marque */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Hammer className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">DevisPro IA</h1>
          <p className="text-sm text-muted-foreground">
            Des devis prêts en une phrase, à partir de ton catalogue.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Accède à ton espace artisan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <ErrorAlert error={error} title="Connexion impossible" />}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                Se connecter
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>

            <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={busy}>
              <Mail className="size-4" />
              Recevoir un lien magique
            </Button>
          </CardContent>
        </Card>

        {/* Pour les recruteurs qui testent la démo */}
        <div className="rounded-lg border border-dashed bg-background p-3 text-center text-xs text-muted-foreground">
          Compte de démo : <span className="font-mono">artisan.a@demo.test</span> /{" "}
          <span className="font-mono">demo1234</span>
        </div>
      </div>
    </div>
  );
}