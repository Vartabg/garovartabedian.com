import { expect, type Page } from "@playwright/test";

/** Cold installation may use the reader's 20-second deadline before the write. */
export async function expectOfflineSave(page: Page, reference: string) {
  const status = page.locator(".scr-offline-save").getByRole("status");
  await expect(status).toHaveText(/saved for offline reading\.$|^Could not save this chapter\./, { timeout: 25_000 });
  await expect(status).toHaveText(`${reference} saved for offline reading.`);
}
