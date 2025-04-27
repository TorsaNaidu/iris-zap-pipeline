import { chromium } from 'playwright';

// Your credentials and URL
const EMAIL = 'torsa.naidu1@geminisolutions.com';
const PASSWORD = 'Dolfin$321';
const APP_URL = 'https://iris-beta.geminisolutions.com'; // Correct IRIS app URL

(async () => {
  const browser = await chromium.launch({ headless: true }); // headless true for CI/CD
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Opening IRIS app...');
  await page.goto(APP_URL, { waitUntil: 'load', timeout: 60000 });

  console.log('🔐 Clicking Microsoft SSO login...');
  await page.waitForSelector('xpath=//p[@class="login-sso"]', { timeout: 60000 });
  await page.click('xpath=//p[@class="login-sso"]');

  console.log('✍️ Filling email...');
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.keyboard.press('Enter');

  console.log('🔑 Filling password...');
  await page.waitForSelector('input[type="password"]', { timeout: 30000 });
  await page.fill('input[type="password"]', PASSWORD);
  await page.keyboard.press('Enter');

  console.log('✅ SSO Login submitted. Waiting for dashboard...');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 });

  // Save session for ZAP
  await context.storageState({ path: 'auth-session.json' });
  console.log('💾 Session saved to auth-session.json');

  // Optional screenshot
  await page.screenshot({ path: 'post-login.png' });
  console.log('📸 Screenshot saved as post-login.png');

  await browser.close();
})();
