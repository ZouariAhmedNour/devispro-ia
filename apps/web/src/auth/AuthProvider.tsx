import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext, type Profile } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Session : au démarrage + à chaque connexion/déconnexion
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Profil + entreprise de l'utilisateur connecté (la RLS ne renvoie que le sien)
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("full_name, company_id, companies(name)")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setProfile({
          fullName: data.full_name,
          companyId: data.company_id,
          companyName: data.companies?.name ?? "",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, profile: session ? profile : null, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}