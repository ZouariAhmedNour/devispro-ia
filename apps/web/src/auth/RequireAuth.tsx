import { Navigate, Outlet } from "react-router";
import { useAuth } from "./useAuth";

export function RequireAuth() {
  const { session, loading } = useAuth();
  if (loading) return <p className="p-6 text-slate-500">Chargement…</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}