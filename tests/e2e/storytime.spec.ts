import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /bedtime stories/i })).toBeVisible();
});

test('creates local demo story and opens replay', async ({ page }) => {
  await page.goto('/create');
  await page.getByLabel(/child display name/i).fill('Ari');
  await page.getByLabel(/theme/i).fill('Moon Garden');
  await page.getByRole('button', { name: /generate story/i }).click();
  await expect(page.getByRole('heading', { name: /Ari's Moon Garden Story/i })).toBeVisible();
  await page.getByRole('link', { name: /open replay/i }).click();
  await expect(page.getByRole('button', { name: /play narration/i })).toBeVisible();
});

test('blocks unsafe prompt', async ({ page }) => {
  await page.goto('/create');
  await page.getByLabel(/parent prompt/i).fill('A story with blood and weapons.');
  await page.getByRole('button', { name: /generate story/i }).click();
  await expect(page.getByRole('alert')).toContainText(/softer bedtime version/i);
});
