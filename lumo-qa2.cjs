const { chromium } = require('playwright-core');
const BASE = 'https://lumo-frontend-production-1dba.up.railway.app';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const report = {};
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)); });
  p.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 150)));

  // ── 1. /login direct ──
  await p.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);
  report.loginPage = await p.evaluate(() => ({
    url: location.pathname,
    title: document.title,
    h1: document.querySelector('h1, h2')?.textContent?.trim().slice(0, 60),
    inputs: [...document.querySelectorAll('input')].map((i) => ({ type: i.type, placeholder: i.placeholder })),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  await p.screenshot({ path: 'C:/Users/rene/lumo-login-page.png', fullPage: true });

  // ── 2. Tentative de login invalide ──
  const emailInput = p.locator('input[type="email"], input[name*="mail"], input[placeholder*="mail"]').first();
  const passInput = p.locator('input[type="password"]').first();
  report.loginForm = { email: (await emailInput.count()) > 0, password: (await passInput.count()) > 0 };
  if (report.loginForm.email && report.loginForm.password) {
    await emailInput.fill('attaque@test.com');
    await passInput.fill('motdepasse-faux-123');
    const btn = p.locator('button[type="submit"]').first();
    await btn.click();
    await p.waitForTimeout(4000);
    report.loginInvalid = await p.evaluate(() => ({
      url: location.pathname,
      toast: document.querySelector('[class*="toast"], [role="alert"], [class*="error"], [class*="alert"]')?.textContent?.trim().slice(0, 140) || 'aucun message',
    }));
    await p.screenshot({ path: 'C:/Users/rene/lumo-login-invalid.png' });
  }

  // ── 3. Cookies + localStorage après tentative ──
  const cdp = await p.context().newCDPSession(p);
  const { cookies } = await cdp.send('Network.getAllCookies');
  report.cookies = cookies.map((c) => ({ name: c.name, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite }));
  report.localStorage = await p.evaluate(() => ({ ...localStorage }));

  // ── 4. Route protégée sans auth → doit rediriger ──
  await p.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);
  report.protectedRoute = await p.evaluate(() => ({ url: location.pathname, redirected: location.pathname !== '/dashboard' }));

  // ── 5. Inscription : champs + tentative (email bidon) ──
  await p.goto(BASE + '/register', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);
  report.registerPage = await p.evaluate(() => ({
    url: location.pathname,
    inputs: [...document.querySelectorAll('input')].map((i) => ({ type: i.type, placeholder: i.placeholder })),
  }));
  await p.screenshot({ path: 'C:/Users/rene/lumo-register.png', fullPage: true });

  report.consoleErrors = errors.slice(0, 10);
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
