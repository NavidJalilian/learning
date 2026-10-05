const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const c = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p = await c.newPage();
  await p.goto('file:///home/user/learning/lessons/0803-url-shortener-base62.html'); await p.waitForTimeout(400);
  await p.fill('#qIn', '179'); await p.fill('#rIn', '59'); await p.click('#divGo');
  await p.locator('#s1 .sim').screenshot({ path: '0803-s1.png' });
  const o = await p.$$('#predict3 .opt'); await o[0].click();
  await p.click('#oSkip'); await p.waitForTimeout(1500);
  await p.locator('#s3 .sim').screenshot({ path: '0803-s3.png' });
  for (let i = 0; i < 5; i++) await p.click('#tryNext');
  await p.locator('#s4 .sim').screenshot({ path: '0803-s4.png' });
  await p.locator('#s2 .puzzles').screenshot({ path: '0803-s2.png' });
  await b.close();
})();
