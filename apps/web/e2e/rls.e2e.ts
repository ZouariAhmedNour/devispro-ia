import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

test("l'artisan B ne voit que son propre catalogue", async ({ page }) => {
  await login(page, ACCOUNTS.b);
  await page.goto("/catalogue");
  await expect(page.getByText("Peinture murale 2 couches")).toBeVisible();
  await expect(page.getByText("Pose carrelage sol")).toHaveCount(0);
});

test("l'artisan B ne peut pas ouvrir un devis de A par son URL", async ({ page }) => {
  await login(page, ACCOUNTS.b);
  await page.goto("/devis/aaaaaaaa-0000-0000-0000-0000000000e1"); // devis de démo de A
  await expect(page.getByText("Devis introuvable")).toBeVisible();
});