import { expect, type Page } from "@playwright/test";

export const ACCOUNTS = {
  a: "artisan.a@demo.test", // Martin Carrelage
  b: "artisan.b@demo.test", // Dubois Peinture
} as const;

export async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/devis$/);
}

type CatalogEntry = { id: string; label: string };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Simule l'Edge Function generate-quote.
 * Le catalogue chargé par la page est capturé pour utiliser ses VRAIS identifiants
 * (le seed ne fixe pas les UUID des prestations).
 */
export async function mockGenerateQuote(
  page: Page,
  buildResponse: (byLabel: (label: string) => string) => unknown,
) {
  let catalog: CatalogEntry[] = [];

  page.on("response", async (response) => {
    if (response.url().includes("/rest/v1/catalog_items") && response.request().method() === "GET") {
      catalog = await response.json().catch(() => catalog);
    }
  });

  await page.route("**/functions/v1/generate-quote", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    const byLabel = (label: string) => {
      const item = catalog.find((i) => i.label === label);
      if (!item) throw new Error(`Prestation absente du catalogue capturé : ${label}`);
      return item.id;
    };
    await route.fulfill({ status: 200, headers: CORS_HEADERS, json: buildResponse(byLabel) });
  });
}