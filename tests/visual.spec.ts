import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

type CanvasSample = {
  ok: boolean;
  reason: string;
  variance?: number;
  colorBuckets?: number;
};

async function sampleCanvas(page: import('@playwright/test').Page): Promise<CanvasSample> {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  if (!box || box.width < 32 || box.height < 32) {
    return { ok: false, reason: 'canvas-too-small' };
  }

  const buffer = await canvas.screenshot();
  const png = PNG.sync.read(buffer);
  let min = 255;
  let max = 0;
  let alphaPixels = 0;
  const buckets = new Set<string>();
  const stride = Math.max(1, Math.floor((png.width * png.height) / 4096));

  for (let pixel = 0; pixel < png.width * png.height; pixel += stride) {
    const offset = pixel * 4;
    const r = png.data[offset];
    const g = png.data[offset + 1];
    const b = png.data[offset + 2];
    const a = png.data[offset + 3];
    min = Math.min(min, r, g, b);
    max = Math.max(max, r, g, b);
    if (a > 0) alphaPixels += 1;
    buckets.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 6}`);
  }

  const variance = max - min;
  return {
    ok: alphaPixels > 256 && (variance > 8 || buckets.size > 3),
    reason: 'sampled',
    variance,
    colorBuckets: buckets.size,
  };
}

test('renders a nonblank interactive game canvas', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#game-canvas')).toBeVisible();
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0) > 10);

  const sample = await sampleCanvas(page);
  expect(sample, JSON.stringify(sample)).toMatchObject({ ok: true });

  const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.player.position.z ?? 0);

  if (testInfo.project.name.includes('mobile')) {
    const stick = page.locator('#touch-stick');
    await expect(stick).toBeVisible();
    const box = await stick.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.05, { steps: 6 });
      await page.waitForTimeout(450);
      await page.mouse.up();
    }
  } else {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(450);
    await page.keyboard.up('KeyW');
  }

  await expect
    .poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.player.position.z ?? 0))
    .toBeLessThan(before - 0.3);

  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(`${testInfo.project.name}-game`, {
    body: screenshot,
    contentType: 'image/png',
  });

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('discovers a landmark through the real interaction flow', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_TEST_HOOKS__));
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState('near-guild'));

  await expect(page.locator('#interaction-prompt')).toBeVisible();
  await expect(page.locator('#interaction-name')).toHaveText('Guilda');
  await page.keyboard.press('KeyE');

  await expect(page.locator('#building-panel')).toBeVisible();
  await expect(page.locator('#building-name')).toHaveText('Guilda');
  await expect(page.locator('#score-value')).toHaveText('1');
  await expect
    .poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.discoveredIds))
    .toContain('guild');

  await page.locator('#building-close').click();
  await page.keyboard.press('KeyE');
  await expect(page.locator('#score-value')).toHaveText('1');

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('all nine authored entrances are reachable and interactive', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop tour covers the shared world graph.');
  test.setTimeout(90_000);

  const stops = [
    ['near-guild', 'guild', 'Guilda'],
    ['near-tavern', 'tavern', 'Taverna'],
    ['near-forge', 'forge', 'Ferraria'],
    ['near-library', 'library', 'Biblioteca'],
    ['near-church', 'church', 'Igreja'],
    ['near-mage-tower', 'mageTower', 'Torre do Mago'],
    ['near-market', 'market', 'Mercado'],
    ['near-hospital', 'hospital', 'Hospital'],
    ['near-home', 'home', 'Sua Casa'],
  ] as const;

  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_TEST_HOOKS__));

  for (const [state, id, label] of stops) {
    await page.evaluate((nextState) => window.__THREE_GAME_TEST_HOOKS__?.setState(nextState), state);
    await expect
      .poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.currentLandmark))
      .toBe(id);
    await expect(page.locator('#interaction-name')).toHaveText(label);
    await page.keyboard.press('KeyE');
    await expect(page.locator('#score-value')).toHaveText('1');
    if (id === 'tavern') {
      await expect(page.locator('#tavern-panel')).toBeVisible();
      await expect(page.locator('#tavern-panel')).toContainText('Taverna do Grifo Dourado');
      await page.locator('#tavern-close').click();
    } else {
      await expect(page.locator('#building-name')).toHaveText(label);
      await page.locator('#building-close').click();
    }
  }

  // From the north-facing home entrance, A+S resolves to world-space south:
  // directly into the porch. The authored proxy must stop the player outside.
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState('near-home'));
  await page.keyboard.down('KeyA');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(1_200);
  await page.keyboard.up('KeyS');
  await page.keyboard.up('KeyA');
  const blockedPosition = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.player.position);
  expect(blockedPosition?.z).toBeLessThan(20.4);

  await expect
    .poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.collision.obstacleCount))
    .toBe(36);
});
