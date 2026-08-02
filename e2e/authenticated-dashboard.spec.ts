import { expect, test } from "@playwright/test";

const talentEmail = process.env.E2E_TALENT_EMAIL;
const talentPassword = process.env.E2E_TALENT_PASSWORD;
const entrepriseEmail = process.env.E2E_ENTREPRISE_EMAIL;
const entreprisePassword = process.env.E2E_ENTREPRISE_PASSWORD;

test.describe("espaces authentifiés", () => {
  test.skip(!talentEmail || !talentPassword, "Identifiants Talent temporaires absents");

  test("le Talent se connecte et conserve la rubrique Documents", async ({ page }) => {
    await page.goto("/talent");
    await page.getByPlaceholder("Email").fill(talentEmail!);
    await page.getByPlaceholder("Mot de passe").fill(talentPassword!);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/talent\/dashboard/, { timeout: 20_000 });
    await page.getByRole("button", { name: "Documents", exact: true }).click();
    await expect(page).toHaveURL(/tab=documents/);
    await expect(page.getByRole("heading", { name: "Mes documents", exact: true })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/tab=documents/);
    await expect(page.getByRole("heading", { name: "Mes documents", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Mon Profil", exact: true }).click();
    await page.getByRole("button", { name: "Supprimer mon compte", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Cette suppression est irréversible" })).toBeVisible();
    const confirmButton = page.getByRole("button", { name: "Supprimer définitivement" });
    await expect(confirmButton).toBeDisabled();
    await page.getByLabel("Confirmation de suppression du compte").fill("SUPPRIMER MON COMPTE");
    await expect(confirmButton).toBeEnabled();
    await page.getByRole("button", { name: "Annuler" }).click();
  });

  test.skip(!entrepriseEmail || !entreprisePassword, "Identifiants Entreprise temporaires absents");

  test("l'Entreprise se connecte et conserve la rubrique Mon Entreprise", async ({ page }) => {
    await page.goto("/entreprise/connexion");
    await page.getByPlaceholder("Email professionnel").fill(entrepriseEmail!);
    await page.getByPlaceholder("Mot de passe").fill(entreprisePassword!);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/entreprise\/dashboard/, { timeout: 20_000 });
    await page.getByRole("button", { name: /^Mon Entreprise/ }).click();
    await expect(page).toHaveURL(/tab=profil/);
    await expect(page.getByRole("heading", { name: "Mon Entreprise" })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/tab=profil/);
    await expect(page.getByRole("heading", { name: "Mon Entreprise" })).toBeVisible();
  });
});
