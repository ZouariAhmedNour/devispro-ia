import { NavLink, Outlet } from "react-router";
import { FileText, Hammer, LogOut, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/devis", label: "Devis", icon: FileText },
  { to: "/catalogue", label: "Catalogue", icon: Package },
  { to: "/clients", label: "Clients", icon: Users },
];

function Brand() {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Hammer className="size-4" />
      </div>
      DevisPro IA
    </div>
  );
}

function NavItems({ className }: { className?: string }) {
  return (
    <nav className={cn("flex gap-1", className)}>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { session, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-muted/40 md:flex">
      {/* Barre latérale (ordinateur) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Brand />
        </div>
        <NavItems className="flex-1 flex-col p-3" />
        <div className="border-t p-4">
          <p className="truncate text-sm font-medium">{profile?.companyName || "…"}</p>
          <p className="truncate text-xs text-muted-foreground">{session?.user.email}</p>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={signOut}>
            <LogOut className="size-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* En-tête (téléphone) */}
      <div className="md:hidden">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3">
          <Brand />
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Déconnexion">
            <LogOut className="size-4" />
          </Button>
        </header>
        <NavItems className="overflow-x-auto border-b bg-background px-2 py-2" />
      </div>

      {/* Contenu de la page */}
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}