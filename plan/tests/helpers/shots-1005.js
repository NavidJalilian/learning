const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1005-notification-boss-design-it-live.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [W, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: 2400 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(FILE); await page.waitForTimeout(300);
    await page.addStyleTag({ content: '.hud,.ivbar,.toast{display:none!important}' });
    for (const k of ['lost', 'dup', 'iso', 'burst', 'alert', 'behind', 'spam', 'over', 'tmpl', 'track']) { await page.click(`#mleft .opt[data-k="${k}"]`); await page.click(`#mright .opt[data-k="${k}"]`); }
    await page.waitForTimeout(400);
    await page.locator('#s3 .mgrid').screenshot({ path: DIR + `1005-${W}-${scheme}-s3grid.png` });
    await page.locator('#arch3').screenshot({ path: DIR + `1005-${W}-${scheme}-s3svg.png` });
    // stage 4 junior state + stage 5 picks
    await page.click('#barrage .opts .opt[data-i="1"]');
    await page.locator('#s4 .stage-b').screenshot({ path: DIR + `1005-${W}-${scheme}-s4.png` });
    await page.locator('#s1').screenshot({ path: DIR + `1005-${W}-${scheme}-s1top.png` });
    await ctx.close();
  }
  await browser.close();
})();
