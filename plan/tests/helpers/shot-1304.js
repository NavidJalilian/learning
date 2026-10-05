const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, sch] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: sch });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/lessons/1304-query-service.html'); await p.waitForTimeout(400);
    await p.locator('#p1svg .pbox[data-k="lb"]').click(); await p.locator('#p1svg .pbox[data-k="api"]').click();
    await p.evaluate(() => { const r = document.querySelector('#s1 .sim').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 110); });
    await p.waitForTimeout(300);
    await p.screenshot({ path: SP + `1304-s1-${w}-${sch}.png` });
    await p.locator('#b2in').click(); await p.keyboard.type('dinner'); await p.keyboard.press('Backspace');
    await p.evaluate(() => { const r = document.querySelector('#s2 .sim').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 110); });
    await p.waitForTimeout(300);
    await p.screenshot({ path: SP + `1304-s2-${w}-${sch}.png` });
    await ctx.close();
  }
  await b.close();
})();
