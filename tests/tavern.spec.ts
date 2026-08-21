import { expect, test, type Page } from '@playwright/test';

type TavernDiagnostics = {
  open: boolean;
  selectedAgentId: string | null;
  messageCount: number;
};

async function readTavernDiagnostics(page: Page): Promise<TavernDiagnostics | undefined> {
  return page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__ as
      | (ThreeGameDiagnostics & { tavern?: TavernDiagnostics })
      | undefined;
    return diagnostics?.tavern;
  });
}

test('recruits an agent and talks to her through the Tavern flow', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0) > 10);
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_TEST_HOOKS__));
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState('near-tavern'));

  await expect
    .poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.currentLandmark))
    .toBe('tavern');
  await expect(page.locator('#interaction-prompt')).toBeVisible();
  await expect(page.locator('#interaction-name')).toHaveText('Taverna');

  if (testInfo.project.name.includes('mobile')) {
    await page.locator('#dash-button').click();
  } else {
    await page.keyboard.press('KeyE');
  }

  const tavern = page.locator('#tavern-panel');
  await expect(tavern).toBeVisible();
  await expect(page.locator('#score-value')).toHaveText('1');
  await expect
    .poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.discoveredIds))
    .toContain('tavern');
  await expect.poll(async () => (await readTavernDiagnostics(page))?.open).toBe(true);

  const roster = tavern.locator('[data-agent-id]');
  await expect(roster).toHaveCount(3);
  await expect(roster).toContainText(['Aldren', 'Brunna', 'Selene']);

  const brunna = roster.filter({ hasText: 'Brunna' });
  await expect(brunna).toHaveCount(1);
  await brunna.click();
  await tavern.locator('#tavern-select-agent').click();

  const activeAgentBadge = page.locator('#active-agent-badge');
  await expect(activeAgentBadge).toBeVisible();
  await expect(page.locator('#active-agent-name')).toHaveText('Brunna');
  await expect(page.locator('#active-agent-role')).toContainText('Executor');
  await expect
    .poll(async () => (await readTavernDiagnostics(page))?.selectedAgentId)
    .toBe('brunna');

  const chatLog = tavern.locator('#tavern-chat-log');
  const playerMessages = chatLog.locator(':scope > [data-message-role="player"]');
  const agentMessages = chatLog.locator(':scope > [data-message-role="agent"]');
  const playerMessageCountBefore = await playerMessages.count();
  const agentMessageCountBefore = await agentMessages.count();
  const diagnosticsBefore = await readTavernDiagnostics(page);
  const question = 'Como você ajuda com código e testes?';

  await tavern.locator('#tavern-chat-input').fill(question);
  await tavern.locator('#tavern-chat-form').evaluate((form) => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Tavern chat must be a form.');
    form.requestSubmit();
  });

  await expect(playerMessages).toHaveCount(playerMessageCountBefore + 1);
  await expect(agentMessages).toHaveCount(agentMessageCountBefore + 1);
  await expect(playerMessages.last()).toContainText(question);
  await expect(agentMessages.last()).not.toHaveText('');
  await expect(agentMessages.last()).not.toHaveText(question);
  await expect
    .poll(async () => (await readTavernDiagnostics(page))?.messageCount ?? 0)
    .toBeGreaterThan(diagnosticsBefore?.messageCount ?? 0);

  await tavern.getByRole('button', { name: /fechar/i }).click();
  await expect(tavern).toBeHidden();
  await expect(activeAgentBadge).toBeVisible();
  await expect(page.locator('#active-agent-name')).toHaveText('Brunna');
  await expect.poll(async () => (await readTavernDiagnostics(page))?.open).toBe(false);

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
