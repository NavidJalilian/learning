const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1503-drive-metadata-and-conflicts.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(URL); await page.waitForTimeout(300);
    await page.addStyleTag({ content: '.hud{position:static!important}' });
    await page.click('#p3 .opt:has-text("processed first")');
    await page.waitForSelector('#p3 .opt:has-text("sees both copies")');
    await page.click('#p3 .opt:has-text("sees both copies")');
    await page.waitForSelector('#resolve.on'); await page.waitForTimeout(500);
    await (await page.$('#s3 .sim')).screenshot({ path: SP + `1503-s3-${w}.png` });
    await page.click('#saveBtn'); await page.waitForTimeout(300);
    await (await page.$('#s1 .stage-b')).screenshot({ path: SP + `1503-s1-${w}.png` });
    await (await page.$('#s4')).screenshot({ path: SP + `1503-s4-${w}.png` });
    await ctx.close();
  }
  await browser.close();
})();
