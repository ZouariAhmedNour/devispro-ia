import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, mockGenerateQuote } from "./helpers";

async function openNewQuote(page: import("@playwright/test").Page) {
  await login(page, ACCOUNTS.a);
  await page.getByRole("button", { name: "Nouveau devis" }).first().click();
  await expect(page).toHaveURL(/\/devis\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Lignes du devis")).toBeVisible(); // catalogue chargé
}

test("génère un devis avec l'IA (simulée), l'enregistre et le retrouve", async ({ page }) => {
  await mockGenerateQuote(page, (byLabel) => ({
    lines: [
      { catalog_item_id: byLabel("Dépose ancien carrelage"), quantity: 12, note: "" },
      { catalog_item_id: byLabel("Pose carrelage sol"), quantity: 12, note: "" },
      { catalog_item_id: byLabel("Déplacement"), quantity: 1, note: "" },
    ],
    questions: [],
    rejected: [],
  }));
  await openNewQuote(page);

  await page.getByPlaceholder(/poser du carrelage neuf/).fill("Salle de bain de 12 m², refaire le carrelage au sol");
  await page.getByRole("button", { name: "Générer les lignes" }).click();

  // Les prix viennent du catalogue, le calcul de computeQuoteTotals
 await expect(page.getByText("3 ligne(s)", { exact: true })).toBeVisible(); 
   await expect(page.getByText(/708,00\s€/).first()).toBeVisible();

  // Enregistrement : save_quote revérifie les totaux côté serveur
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Devis enregistré")).toBeVisible();

  // Après rechargement, tout vient de la base
  await page.reload();
  await expect(page.getByText("3 ligne(s)", { exact: true })).toBeVisible(); 
  await expect(page.getByText(/708,00\s€/).first()).toBeVisible();
});

test("affiche les questions de l'IA au lieu d'inventer", async ({ page }) => {
  await mockGenerateQuote(page, () => ({
    lines: [],
    questions: ["Quelle est la surface de la cuisine ?"],
    rejected: [],
  }));
  await openNewQuote(page);

  await page.getByPlaceholder(/poser du carrelage neuf/).fill("Refaire le carrelage de la cuisine");
  await page.getByRole("button", { name: "Générer les lignes" }).click();

  await expect(page.getByText("L'IA a besoin de précisions")).toBeVisible();
  await expect(page.getByText("Quelle est la surface de la cuisine ?")).toBeVisible();
  await expect(page.getByText("0 ligne(s)", { exact: true })).toBeVisible();
});

test("signale les propositions rejetées (hors catalogue)", async ({ page }) => {
  await mockGenerateQuote(page, (byLabel) => ({
    lines: [{ catalog_item_id: byLabel("Pose carrelage sol"), quantity: 10, note: "" }],
    questions: [],
    rejected: [{ ref: "C99", reason: "Prestation absente du catalogue" }],
  }));
  await openNewQuote(page);

  await page.getByPlaceholder(/poser du carrelage neuf/).fill("Poser du carrelage et du parquet");
  await page.getByRole("button", { name: "Générer les lignes" }).click();

  await expect(page.getByText("1 ligne(s)", { exact: true })).toBeVisible();
  await expect(page.getByText(/1 proposition\(s\) écartée\(s\)/)).toBeVisible();
});