const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file:///home/user/learning/lessons/0406-boss-throttle-it-live.html'); await page.waitForTimeout(500);
  // stage 3 first, all correct
  for (const k of ['rules', 'workers', 'cache', 'mq']) await page.click(`#tiles3 .opt[data-k="${k}"]`);
  await page.waitForSelector('#statuses .opt'); await page.click('#statuses .opt[data-s="429"]');
  for (const k of ['lim', 'rem', 'ret']) await page.click(`#hchips .opt[data-h="${k}"]`);
  await page.waitForSelector('#goalcard h3');
  const G = { 'Allow short bursts': 'tb', 'Exact rolling limit': 'swl', 'Smooth edges, little memory': 'swc', 'Atomic check-and-increment': 'lua', 'One count across many servers': 'redis', 'Low latency far away': 'edge', 'Survive a Redis outage': 'open' };
  for (let i = 0; i < 7; i++) { const h = (await page.textContent('#goalcard h3')).trim(); await page.click(`#tpal .opt[data-t="${G[h]}"]`); await page.waitForFunction(h => document.querySelector('#goalcard h3').textContent.trim() !== h, h); }
  await page.waitForTimeout(1200);
  // stage 5 next
  for (const t of ['Hard vs soft', 'Layer 7', 'Name the bottleneck']) await page.locator('#wrapcards .opt', { hasText: t }).first().click();
  await page.click('#deliver'); await page.waitForTimeout(1500);
  console.log('cleared', await page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage)), 'clock', await page.textContent('#ivClock'), 'step', await page.textContent('#ivStep'), 'errors', errs);
  await browser.close();
})();
