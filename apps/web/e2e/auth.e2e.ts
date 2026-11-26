import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

test("redirige vers la connexion sans session", async ({ page }) => {
  await page.goto("/devis");
  await expect(page).toHaveURL(/\/login$/);
});

test("refuse un mauvais mot de passe", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(ACCOUNTS.a);
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
});

test("connecte l'artisan A sur son espace", async ({ page }) => {
  await login(page, ACCOUNTS.a);
  await expect(page.getByRole("complementary").getByText("Martin Carrelage")).toBeVisible();
});