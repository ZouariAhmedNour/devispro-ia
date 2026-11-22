import { NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "font-semibold text-blue-700" : "text-slate-600 hover:text-slate-900";

export default function Layout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold">DevisPro IA</span>
            <nav className="flex gap-4 text-sm">
              <NavLink to="/catalogue" className={linkClass}>Catalogue</NavLink>
              <NavLink to="/clients" className={linkClass}>Clients</NavLink>
              <NavLink to="/devis" className={linkClass}>Devis</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{profile?.companyName}</span>
            <button onClick={signOut} className="rounded border px-2 py-1 hover:bg-slate-100">
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}