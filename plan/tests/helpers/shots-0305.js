const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0305-boss-run-the-room.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(FILE); await page.waitForTimeout(1500);
    await page.locator('#s1menu .opt').first().waitFor();
    await page.locator('#s1 .chat').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SP}0305-${w}-${scheme}-s1.png` });
    await page.click('#topics .opt[data-k="fan"]'); await page.click('#topics .opt[data-k="ret"]');
    await page.locator('#s3a').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SP}0305-${w}-${scheme}-s3.png` });
    await page.click('#tx .tline[data-i="0"] .opt[data-t="R"]');
    await page.locator('#tx').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SP}0305-${w}-${scheme}-s5.png` });
    await ctx.close();
  }
  await browser.close();
})();
