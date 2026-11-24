import { Navigate, Route, Routes } from "react-router";

import CatalogPage from "@/features/catalog/CatalogPage";
import ClientsPage from "@/features/clients/ClientsPage";
import QuotesPage from "@/features/quotes/QuotesPage";
import QuoteEditorPage from "@/features/quotes/QuoteEditorPage";
import LoginPage from "./features/auth/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import AppLayout from "./components/layout/AppLayout";

export default function App() {
  return (
    <Routes>
      {/* Page publique */}
      <Route path="/login" element={<LoginPage />} />

      {/* Pages protégées : redirection vers /login si non connecté */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/catalogue" element={<CatalogPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/devis" element={<QuotesPage />} />
          <Route path="/devis/:id" element={<QuoteEditorPage />} />
        </Route>
      </Route>

      {/* Toute autre URL renvoie vers le catalogue */}
      <Route path="*" element={<Navigate to="/catalogue" replace />} />
    </Routes>
  );
}
