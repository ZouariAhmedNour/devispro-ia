import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { session } = useAuth();
  const [email, setEmail] = useState("artisan.a@demo.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/catalogue" replace />;

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
    else setInfo("Lien envoyé ! En local, ouvre Mailpit : http://localhost:54324");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handlePassword}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold">DevisPro IA</h1>
        <p className="text-sm text-slate-500">Connecte-toi à ton espace artisan.</p>

        <label className="block text-sm">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Se connecter
        </button>
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={busy}
          className="w-full rounded border py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Recevoir un lien magique
        </button>
      </form>
    </div>
  );
}