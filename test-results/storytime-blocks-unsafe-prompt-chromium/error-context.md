# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storytime.spec.ts >> blocks unsafe prompt
- Location: tests/e2e/storytime.spec.ts:18:1

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "http://127.0.0.1:3000/create", waiting until "load"

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('home page loads', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page.getByRole('heading', { name: /bedtime stories/i })).toContainText(/bedtime stories/i);
  6  | });
  7  | 
  8  | test('creates local demo story and opens replay', async ({ page }) => {
  9  |   await page.goto('/create');
  10 |   await page.getByLabel(/child display name/i).fill('Ari');
  11 |   await page.getByLabel(/theme/i).fill('Moon Garden');
  12 |   await page.getByRole('button', { name: /generate story/i }).click();
  13 |   await expect(page.getByRole('heading', { name: /Ari's Moon Garden Story/i })).toContainText(/Ari's Moon Garden Story/i);
  14 |   await page.getByRole('link', { name: /open replay/i }).click();
  15 |   await expect(page.getByRole('button', { name: /play narration/i })).toBeAttached();
  16 | });
  17 | 
  18 | test('blocks unsafe prompt', async ({ page }) => {
> 19 |   await page.goto('/create');
     |              ^ Error: page.goto: Target page, context or browser has been closed
  20 |   await page.getByLabel(/parent prompt/i).fill('A story with blood and weapons.');
  21 |   await page.getByRole('button', { name: /generate story/i }).click();
  22 |   await expect(page.getByRole('alert')).toContainText(/softer bedtime version/i);
  23 | });
  24 | 
```