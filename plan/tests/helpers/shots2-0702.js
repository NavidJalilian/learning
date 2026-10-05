const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/lessons/0702-uuid-and-ticket-server.html');
  await p.addStyleTag({ content: '.hud{position:static !important}' });
  await p.$eval('#yrs', el => { el.value = 193; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.locator('#s2 .sim').screenshot({ path: '0702-g-gauge.png' });
  await p.click('#tkRun'); await p.waitForTimeout(300);
  await p.locator('#tkBox .opt').filter({ hasText: /^Every web/ }).click(); await p.waitForTimeout(400);
  await p.locator('#tkBox .btn.primary').click();
  await p.locator('#tkBox .opt').filter({ hasText: /^One counts/ }).click(); await p.waitForTimeout(400);
  await p.locator('#s3 .sim').screenshot({ path: '0702-g-two.png' });
  await p.locator('#tkBox').screenshot({ path: '0702-g-twobox.png' });
  await b.close();
})();
