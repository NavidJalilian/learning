const { chromium } = require('playwright');
const D = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, sch] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: sch });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/lessons/0804-url-shortener-flows-and-scale.html');
    await p.waitForTimeout(800);
    for (const id of ['hero', 's1', 's2', 's3', 's4']) {
      const el = id === 'hero' ? p.locator('.hero') : p.locator('#' + id);
      await el.screenshot({ path: `${D}sh0804-${w}-${id}.png` });
    }
    await ctx.close();
  }
  await b.close();
})();
