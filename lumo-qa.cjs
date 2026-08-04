const { chromium } = require('playwright-core');

const URL = 'https://lumo-frontend-production-1dba.up.railway.app/';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const report = {};

  // ── 1. Landing page ──
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  p.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));
  p.on('requestfailed', (r) => errors.push('REQFAIL: ' + r.url().slice(0, 100) + ' ' + (r.failure()?.errorText || '')));

  await p.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2500);

  report.landing = await p.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim().slice(0, 80) || 'aucun',
    links: [...document.querySelectorAll('a')].slice(0, 12).map((a) => a.textContent.trim().slice(0, 30) || a.getAttribute('href')),
    hasLoginLink: !!document.querySelector('a[href*="login"], a[href*="connexion"]') || document.body.textContent.includes('Connexion'),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  await p.screenshot({ path: 'C:/Users/rene/lumo-landing.png', fullPage: true });

  // ── 2. Page login ──
  await p.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find((x) => /login|connexion/i.test(x.href + ' ' + x.textContent));
    if (a) a.click();
  });
  await p.waitForTimeout(2500);
  const loginUrl = p.url();
  report.login = await p.evaluate(() => ({
    url: location.pathname,
    title: document.title,
    formFields: [...document.querySelectorAll('input')].map((i) => ({ type: i.type, name: i.name, placeholder: i.placeholder })),
    localStorage: { ...localStorage },
    cookies: document.cookie,
  }));
  report.login.cookiesJs = report.login.cookies; // ce que JS peut voir (HttpOnly invisible)
  await p.screenshot({ path: 'C:/Users/rene/lumo-login.png', fullPage: true });

  // cookies réels avec flags (via CDP)
  const cdp = await p.context().newCDPSession(p);
  const { cookies } = await cdp.send('Network.getAllCookies');
  report.allCookies = cookies.map((c) => ({
    name: c.name, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite, domain: c.domain, path: c.path,
  }));

  // ── 3. Test formulaire login (identifiants invalides) — résilient ──
  try {
    const emailInput = p.locator('input[type="email"], input[name*="mail"], input[placeholder*="mail"]').first();
    const passInput = p.locator('input[type="password"]').first();
    const emailCount = await emailInput.count();
    const passCount = await passInput.count();
    report.loginFormFound = { email: emailCount > 0, password: passCount > 0 };
    if (emailCount > 0 && passCount > 0) {
      await emailInput.fill('test@invalide.com');
      await passInput.fill('mauvais-mdp-123');
      const btn = p.locator('button[type="submit"]').first();
      if (await btn.count()) {
        await btn.click();
        await p.waitForTimeout(3000);
        report.loginInvalid = await p.evaluate(() => ({
          url: location.pathname,
          toast: document.querySelector('[class*="toast"], [role="alert"], [class*="error"]')?.textContent?.trim().slice(0, 120) || 'aucun message visible',
        }));
        await p.screenshot({ path: 'C:/Users/rene/lumo-login-error.png' });
      } else {
        report.loginInvalid = 'bouton submit introuvable';
      }
    } else {
      report.loginInvalid = 'formulaire incomplet sur cette page';
    }
  } catch (e) {
    report.loginInvalid = 'test ignoré: ' + String(e).slice(0, 80);
  }

  report.consoleErrors = errors.slice(0, 10);
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
