import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";

export interface Profile {
  fullName: string | null;
  companyId: string;
  companyName: string;
}

export interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);