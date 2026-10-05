const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0802-url-shortener-hash-and-collisions.html';
const D = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q0802/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const scheme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(FILE); await page.waitForTimeout(300);
  await page.click('#tray .col-chip[data-n="id"]'); await page.click('#tray .col-chip[data-n="shortURL"]'); await page.click('#tray .col-chip[data-n="longURL"]'); await page.click('#tray .col-chip[data-n="userId"]');
  await page.locator('#s1 .stage-b').screenshot({ path: D + `m1-${scheme}.png` });
  await page.click('#s2guess .opt[data-g="6"]'); await page.focus('#nSlider'); for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
  await page.locator('#s2 .sim').screenshot({ path: D + `m2-${scheme}.png` });
  await page.click('#chopBtn');
  await page.locator('#hashLab').screenshot({ path: D + `m3-${scheme}.png` });
  await page.click('#addNext'); await page.waitForTimeout(400);
  await page.click('#s4predict .opt[data-i="1"]'); await page.click('#bulkBtn'); await page.waitForTimeout(3000);
  await page.locator('#s4 .sim').screenshot({ path: D + `m4-${scheme}.png` });
  for (let i = 0; i < 8; i++) { await page.click('#bAdd'); await page.waitForTimeout(50); }
  await page.click('#cands .cand[data-k="2"] .opt[data-p="maybe"]'); await page.waitForTimeout(200);
  await page.locator('#s5 .sim').screenshot({ path: D + `m5-${scheme}.png` });
  await page.locator('#s5 .stage-h').screenshot({ path: D + `h5-${scheme}.png` });
  await ctx.close();
  }
  await browser.close();
})();
