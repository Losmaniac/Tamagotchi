import { expect, test } from '@playwright/test';

test('selection screen loads and switches language', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Pick your pal' })).toBeVisible();
  await page.getByRole('button', { name: 'CS' }).click();
  await expect(page.getByRole('heading', { name: 'Vyber si kámoše' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Vyber si kámoše' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('works offline after first load', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pick your pal' })).toBeVisible();
});
