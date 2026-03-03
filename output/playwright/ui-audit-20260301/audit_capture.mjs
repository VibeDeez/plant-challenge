import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';

const BASE = 'http://localhost:3100';
const OUT = path.resolve('/Users/henryadams/Desktop/Placeholder/output/playwright/ui-audit-20260301');

async function capture(page, name, fullPage = false) {
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage });
  console.log(`captured:${name}.png @ ${page.url()}`);
}

async function clickBottomTab(page, label) {
  await page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') }).click();
  await page.waitForTimeout(450);
}

async function closeIfVisible(page, labelRegex) {
  const closeBtn = page.getByLabel(labelRegex);
  if (await closeBtn.count()) {
    await closeBtn.first().click();
    await page.waitForTimeout(250);
  }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  });
  const page = await context.newPage();

  // Auth bootstrap
  await page.goto(`${BASE}/api/e2e/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Home
  await capture(page, 'home_01_default');

  // Add page + states
  await page.getByRole('link', { name: /Log a Plant/i }).first().click();
  await page.waitForTimeout(600);
  await capture(page, 'add_01_default');

  const addAccordionButtons = page.locator('button[aria-expanded]');
  if (await addAccordionButtons.count()) {
    await addAccordionButtons.first().click();
    await page.waitForTimeout(300);
  }
  await capture(page, 'add_02_accordion_expanded');

  await page.getByRole('button', { name: /Pic Log/i }).first().click();
  await page.waitForTimeout(450);
  await capture(page, 'add_03_pic_modal');
  await closeIfVisible(page, /Close photo recognition sheet/i);

  await page.getByRole('button', { name: /Voice Log/i }).first().click();
  await page.waitForTimeout(450);
  await capture(page, 'add_04_voice_modal');
  await closeIfVisible(page, /Close voice log sheet/i);

  await page.getByRole('button', { name: /see your plant/i }).first().click();
  await page.waitForTimeout(450);
  await capture(page, 'add_05_custom_sheet');
  await closeIfVisible(page, /Close custom plant sheet/i);

  const search = page.getByPlaceholder('Search plants...');
  await search.fill('zzzzzzzzzz');
  await page.waitForTimeout(300);
  await capture(page, 'add_06_no_results');
  await search.fill('');
  await page.waitForTimeout(250);

  // Seed a few logs for populated Home state
  const seedNames = ['Apple', 'Banana', 'Avocado', 'Coconut', 'Cherry'];
  for (const name of seedNames) {
    const chip = page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') });
    if (await chip.count()) {
      await chip.first().click();
      await page.waitForTimeout(120);
    }
  }

  // Home populated
  await clickBottomTab(page, 'Home');
  await page.waitForTimeout(550);
  await capture(page, 'home_02_populated');

  const homeAccordionButtons = page.locator('button[aria-expanded]');
  if (await homeAccordionButtons.count()) {
    await homeAccordionButtons.first().click();
    await page.waitForTimeout(300);
    await capture(page, 'home_03_accordion_expanded');
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await capture(page, 'home_04_bottom_surface');

  // Circles
  await clickBottomTab(page, 'Circles');
  await page.waitForTimeout(550);
  await capture(page, 'circles_01_default');

  await page.getByRole('button', { name: /^Join a Circle$/i }).first().click();
  await page.waitForTimeout(400);
  await capture(page, 'circles_02_join_modal');
  await page.locator('#join-code').fill('ABCD!!');
  await page.getByRole('button', { name: /^Join$/i }).click();
  await page.waitForTimeout(350);
  await capture(page, 'circles_03_join_error');
  await closeIfVisible(page, /Close join circle sheet/i);

  // Create flow + detail/settings coverage
  await page.getByRole('link', { name: /Create a Circle/i }).first().click();
  await page.waitForTimeout(500);
  await capture(page, 'circles_create_01_form');

  const circleName = `Audit Circle ${Date.now().toString().slice(-4)}`;
  await page.locator('#circle-name').fill(circleName);
  await page.getByRole('button', { name: /^Create$/i }).click();
  await page.waitForTimeout(800);
  await capture(page, 'circles_create_02_success');

  const goToCircle = page.getByRole('link', { name: /Go to Circle/i });
  if (await goToCircle.count()) {
    await goToCircle.first().click();
    await page.waitForTimeout(600);
  }
  await capture(page, 'circles_detail_01_default');

  const settingsLink = page.getByRole('link').filter({ hasText: '' }).locator('[href$="/settings"]');
  if (await settingsLink.count()) {
    await settingsLink.first().click();
    await page.waitForTimeout(600);
  } else {
    await page.goto(`${page.url().replace(/\/$/, '')}/settings`, { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(350);
  await capture(page, 'circles_detail_02_settings');

  // Sage
  await clickBottomTab(page, 'Sage');
  await page.waitForTimeout(500);
  await capture(page, 'sage_01_top');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await capture(page, 'sage_02_bottom');

  // Learn
  await clickBottomTab(page, 'Learn');
  await page.waitForTimeout(500);
  await capture(page, 'learn_01_top');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
  await page.waitForTimeout(300);
  await capture(page, 'learn_02_mid');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await capture(page, 'learn_03_bottom');

  // Profile
  await clickBottomTab(page, 'Profile');
  await page.waitForTimeout(500);
  await capture(page, 'profile_01_default');

  // Unauthenticated auth routes
  const unauth = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  });
  const authPage = await unauth.newPage();
  await authPage.goto(`${BASE}/auth`, { waitUntil: 'networkidle' });
  await authPage.waitForTimeout(400);
  await capture(authPage, 'auth_01_default');
  await authPage.goto(`${BASE}/auth/reset-password`, { waitUntil: 'networkidle' });
  await authPage.waitForTimeout(400);
  await capture(authPage, 'auth_02_reset_password');

  await unauth.close();
  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
