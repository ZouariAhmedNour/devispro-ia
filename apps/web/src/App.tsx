import { Navigate, Route, Routes } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import CatalogPage from "./pages/CatalogPage";
import ClientsPage from "./pages/ClientsPage";
import QuotesPage from "./pages/QuotesPage";

export default function App() {
  return (
    <Routes>
      {/* Page publique */}
      <Route path="/login" element={<LoginPage />} />

      {/* Pages protégées : redirection vers /login si non connecté */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/catalogue" element={<CatalogPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/devis" element={<QuotesPage />} />
          <Route path="/devis/:id" element={<ComingSoon title="Éditeur de devis" />} />
        </Route>
      </Route>

      {/* Toute autre URL renvoie vers le catalogue */}
      <Route path="*" element={<Navigate to="/catalogue" replace />} />
    </Routes>
  );
}

function ComingSoon({ title }: { title: string }) {
  return <h1 className="text-xl font-semibold">{title} : bientôt</h1>;
}