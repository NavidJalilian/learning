const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0205-boss-estimation-gauntlet.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(FILE); await page.waitForTimeout(500);
  for (const k of ['dau', 'wq', 'pw', 'rq', 'sd', 's5', 'cache', 'srv']) await page.click(`#ptiles .opt[data-k="${k}"]`);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const r = document.querySelector('#s2 .sim').getBoundingClientRect(); scrollBy(0, r.top - 180); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: SP + '/0205-s2b.png' });
  const P = ['~7,000', '~35,000', '~60 GB'];
  for (let i = 0; i < 3; i++) { await page.locator('#match .mchip', { hasText: P[i] }).click(); await page.click(`#match .mcard[data-i="${i}"]`); }
  await page.locator('#match .mchip', { hasText: '~55 PB' }).click();
  await page.evaluate(() => { const r = document.querySelector('#match').getBoundingClientRect(); scrollBy(0, r.top - 170); });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: SP + '/0205-s5b.png' });
  await browser.close();
})();
