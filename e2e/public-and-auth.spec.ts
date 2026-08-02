import { expect, test } from "@playwright/test";

test.describe("parcours publics et authentification", () => {
  test("un talent accède à la création de compte depuis l'accueil", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Booste ton CV avec/i }),
    ).toBeVisible();

    await page.getByRole("link", { name: /Analyser mon CV gratuitement/i }).click();
    await expect(page).toHaveURL(/\/talent$/);
    await expect(page.getByRole("heading", { name: "Connexion Talent" })).toBeVisible();

    await page.getByRole("button", { name: "S'inscrire" }).click();
    await expect(page.getByRole("heading", { name: "Créer un compte talent" })).toBeVisible();
    await expect(page.getByPlaceholder("Nom complet")).toBeVisible();
    await expect(page.getByPlaceholder("Telephone")).toBeVisible();
    await expect(page.getByRole("link", { name: "CGU" })).toHaveAttribute("href", "/cgu");
  });

  test("une entreprise accède à son formulaire d'inscription", async ({ page }) => {
    await page.goto("/entreprise/connexion");

    await expect(page.getByRole("heading", { name: "Espace Entreprise" })).toBeVisible();
    await page.getByRole("button", { name: "S'inscrire" }).click();

    await expect(page.getByRole("heading", { name: "Créer un compte entreprise" })).toBeVisible();
    await expect(page.getByPlaceholder("Nom de l'entreprise")).toBeVisible();
    await expect(page.getByPlaceholder(/SIRET/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Commencer l'essai gratuit/i })).toBeVisible();
  });

  test("les espaces privés redirigent vers la bonne connexion", async ({ page }) => {
    await page.goto("/talent/dashboard?tab=documents");
    await expect(page).toHaveURL(/\/talent$/);
    await expect(page.getByRole("heading", { name: "Connexion Talent" })).toBeVisible();

    await page.goto("/entreprise/dashboard?tab=documents");
    await expect(page).toHaveURL(/\/entreprise\/connexion$/);
    await expect(page.getByRole("heading", { name: "Espace Entreprise" })).toBeVisible();
  });

  test("les pages légales restent accessibles", async ({ page }) => {
    await page.goto("/cgu");
    await expect(page.getByRole("heading", { name: "Mentions légales & CGU" })).toBeVisible();

    await page.goto("/confidentialite");
    await expect(page.getByRole("heading", { name: "Politique de confidentialité" })).toBeVisible();
  });
});
