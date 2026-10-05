import { expect, test, type Page } from '@playwright/test';

// Mobile smoke tests (390×844, see playwright.config.ts). `?debug=1` exposes the hidden
// debug panel, used here to skip the 5-minute egg stage.

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  return errors;
}

async function hatch(page: Page, name = 'Mochi') {
  await page.goto('./?debug=1');
  await page.getByRole('button', { name: 'Next pet' }).click();
  await page.getByRole('radio', { name: 'Color 2' }).click();
  await page.getByPlaceholder('Name your pal').fill(name);
  await page.getByRole('button', { name: /Hatch it/ }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText(/Hatches in \d+:\d\d/)).toBeVisible();
}

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /Settings/ }).click();
}

async function skipStage(page: Page) {
  await page.getByRole('button', { name: 'Debug' }).click();
  await page.getByRole('button', { name: 'Skip stage' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
}

test('hatch, care, play, shop and switch language', async ({ page }) => {
  const errors = collectErrors(page);
  await hatch(page);
  await skipStage(page);
  await expect(page.getByText('Baby', { exact: true })).toBeVisible();

  // Stat bars expose ARIA values.
  const food = page.getByRole('progressbar', { name: 'Food' });
  await expect(food).toHaveAttribute('aria-valuenow', '80');

  // Feed a meal.
  await page.getByRole('button', { name: 'Feed', exact: true }).click();
  await page.getByRole('button', { name: /Meal/ }).click();
  await expect(food).toHaveAttribute('aria-valuenow', '100');

  // Play "Left or Right" for 5 rounds and collect coins.
  const coinsBefore = await page
    .getByRole('button', { name: /Coins: \d+/ })
    .getAttribute('aria-label');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: /Left or Right/ }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 5; i++) {
    const left = page.getByRole('button', { name: /Left$/ });
    await expect(left).toBeEnabled();
    await left.click();
  }
  await expect(page.getByText(/\+\d+ coins · \+fun/)).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  const coinsAfter = await page
    .getByRole('button', { name: /Coins: \d+/ })
    .getAttribute('aria-label');
  expect(coinsAfter).not.toEqual(coinsBefore);

  // Shop opens and lists cosmetics.
  await page.getByRole('button', { name: /Shop/ }).click();
  await expect(page.getByRole('tab', { name: 'Hats' })).toBeVisible();
  await page.getByRole('button', { name: /Buy Party hat/ }).click();
  await expect(page.getByRole('button', { name: 'Take off' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Switch to Czech: every string updates instantly, plurals included.
  await openSettings(page);
  await page.getByRole('button', { name: 'Čeština' }).click();
  await expect(page.getByRole('dialog', { name: 'Nastavení' })).toBeVisible();
  await page.getByRole('button', { name: 'Zavřít' }).click();
  await expect(page.getByRole('progressbar', { name: 'Jídlo' })).toBeVisible();
  await page.getByRole('button', { name: 'Statistiky' }).click();
  const stats = page.getByRole('dialog', { name: 'Statistiky' });
  await expect(stats.getByText('Fáze', { exact: true })).toBeVisible();
  await expect(stats.getByText(/^\d+ (sekunda|sekundy|sekund|minuta|minuty|minut)$/)).toBeVisible();
  await page.getByRole('button', { name: 'Zavřít' }).click();

  // Save survives a reload.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mochi' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Jídlo' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('shows a summary after time away', async ({ page }) => {
  const errors = collectErrors(page);
  await hatch(page, 'Pixel');
  await skipStage(page);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pocketpals:v1')!);
    const pet = raw.state.game.pet;
    for (const k of ['bornAt', 'hatchedAt', 'stageStartedAt', 'lastTickAt'])
      pet[k] -= 8 * 3_600_000;
    localStorage.setItem('pocketpals:v1', JSON.stringify(raw));
  });
  await page.goto('./');
  await expect(page.getByRole('dialog', { name: 'While you were away…' })).toBeVisible();
  await expect(page.getByText('You were gone for 8 hours.')).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  expect(errors).toEqual([]);
});

test('death leads to the memorial and a new egg', async ({ page }) => {
  await hatch(page, 'Bubbles');
  await skipStage(page);
  await page.getByRole('button', { name: 'Debug' }).click();
  await page.getByRole('button', { name: 'Kill pet' }).click();
  await expect(page.getByRole('heading', { name: 'Goodbye, Bubbles' })).toBeVisible();
  await page.getByRole('button', { name: /Memorial/ }).click();
  await expect(
    page.getByRole('dialog', { name: /Memorial/ }).getByText('Bubbles', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: /Hatch a new egg/ }).click();
  await expect(page.getByRole('heading', { name: 'Pick your pal' })).toBeVisible();
});

test('exports and re-imports the save', async ({ page }) => {
  await hatch(page, 'Saver');
  await openSettings(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export save/ }).click();
  const file = await (await download).path();

  await page.getByRole('button', { name: /Reset game/ }).click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, reset' }).click();
  await expect(page.getByRole('heading', { name: 'Pick your pal' })).toBeVisible();

  // Import works from the settings of a new game.
  await hatch(page, 'Temp');
  await openSettings(page);
  await page.getByLabel('Import save').setInputFiles(file);
  await expect(page.getByText('Save imported!')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading', { name: 'Saver' })).toBeVisible();

  await openSettings(page);
  await page.getByLabel('Import save').setInputFiles({
    name: 'x.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"nope":1}'),
  });
  await expect(page.getByText('That file isn’t a Pocket Pals save.')).toBeVisible();
});

test('is installable and works offline', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);

  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  // Playwright contexts are incognito-like; that is the only acceptable complaint.
  expect(installabilityErrors.filter((e) => e.errorId !== 'in-incognito')).toEqual([]);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pick your pal' })).toBeVisible();
  await page.getByPlaceholder('Name your pal').fill('Offline');
  await page.getByRole('button', { name: /Hatch it/ }).click();
  await expect(page.getByRole('heading', { name: 'Offline' })).toBeVisible();
});

test('learning features: facts, encyclopedia, snacks, piggy bank, word game', async ({ page }) => {
  const errors = collectErrors(page);
  await hatch(page, 'Scholar');
  await skipStage(page);

  // The pet tells today's fact; it lands in the encyclopedia.
  await page.getByRole('button', { name: /New fact/ }).click();
  await expect(page.getByRole('dialog', { name: /Did you know/ })).toBeVisible();
  await page.getByRole('button', { name: /Add to encyclopedia/ }).click();
  await expect(page.getByRole('button', { name: /New fact/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /Encyclopedia/ }).click();
  await expect(page.getByText('1 of 88 facts learned')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Healthy snack from the snack picker (the second species is the pup; its favourite is a bone).
  await page.getByRole('button', { name: 'Feed', exact: true }).click();
  await page.getByRole('button', { name: /Chew bone/ }).click();
  await expect(page.getByText(/Favourite food found/)).toBeVisible();

  // Piggy bank: save all coins.
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /Piggy bank/ }).click();
  await page
    .getByRole('button', { name: /^Save \d+$/ })
    .last()
    .click();
  await expect(page.getByText(/Next interest in/)).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Diary has today's entry.
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /Carer’s diary/ }).click();
  await expect(page.getByText('Probably felt:')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Word Snack: answer all 8 rounds.
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: /Word Snack/ }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 8; i++) {
    const option = page.locator('div.grid.gap-2 button').first();
    await expect(option).toBeEnabled();
    await option.click();
  }
  await expect(page.getByText(/coins · \+fun/)).toBeVisible();
  expect(errors).toEqual([]);
});
