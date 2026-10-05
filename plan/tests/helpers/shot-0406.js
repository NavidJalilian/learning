const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    // pretend quest is cleared so all parts can be forced visible
    await page.goto('file:///home/user/learning/lessons/0406-boss-throttle-it-live.html'); await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelectorAll('#archB .part').forEach(p => p.classList.add('on')));
    await page.locator('#s2 .sim').screenshot({ path: `${SP}/0406-archA-${w}-${scheme}.png` });
    await page.locator('#s3 .sim').screenshot({ path: `${SP}/0406-archB-${w}-${scheme}.png` });
    await ctx.close();
  }
  await browser.close();
})();
