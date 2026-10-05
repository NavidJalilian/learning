const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/lessons/0702-uuid-and-ticket-server.html');
    for (let i = 0; i < 5; i++) await p.click('#uuGen');
    await p.click('#gA .gcol[data-g="0"]');
    await p.click('#tkRun'); await p.waitForTimeout(500);
    await p.$eval('#yrs', el => { el.value = 193; el.dispatchEvent(new Event('input', { bubbles: true })); });
    for (const n of [1, 2, 3]) await p.locator('#s' + n).screenshot({ path: `0702-shot-${w}-s${n}.png` });
    await ctx.close();
  }
  await b.close();
})();
