import { expect, test, type Page } from '@playwright/test';

async function prepareDeterministicScreenshot(page: Page, stateName: string): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0) > 10);

  const hasHooks = await page.evaluate(() => Boolean(window.__THREE_GAME_TEST_HOOKS__));
  if (!hasHooks) throw new Error('Deterministic Three.js screenshot hooks are missing.');

  await page.evaluate((name) => {
    const hooks = window.__THREE_GAME_TEST_HOOKS__;
    hooks?.seed(12345);
    hooks?.setReducedMotion(true);
    hooks?.hideDebugUi(true);
    hooks?.setState(name);
    hooks?.setPausedForScreenshot(true);
  }, stateName);
  await page.waitForTimeout(180);
}

test('south gate exploration visual baseline', async ({ page }, testInfo) => {
  await prepareDeterministicScreenshot(page, 'active-play');
  await expect(page).toHaveScreenshot(`active-play-${testInfo.project.name}.png`, {
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });
});

test('completed village visual baseline', async ({ page }, testInfo) => {
  await prepareDeterministicScreenshot(page, 'complete');
  await expect(page).toHaveScreenshot(`complete-${testInfo.project.name}.png`, {
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });
});

test('Tavern agent roster visual baseline', async ({ page }, testInfo) => {
  await prepareDeterministicScreenshot(page, 'tavern-open');
  await expect(page.locator('#tavern-panel')).toBeVisible();
  await expect(page).toHaveScreenshot(`tavern-open-${testInfo.project.name}.png`, {
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });
});
