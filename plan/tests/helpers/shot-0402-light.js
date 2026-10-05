const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p.goto('file:///home/user/learning/lessons/0402-token-and-leaking-bucket.html'); await p.waitForTimeout(1200);
  await p.click('#tbFive'); await p.waitForTimeout(300);
  await (await p.$('#s1 .sim')).screenshot({ path: '0402-light-s1.png' });
  await p.fill('#r2in', '3'); await p.click('#r2go'); await p.waitForSelector('#r2box .row .btn', { timeout: 20000 });
  await (await p.$('#s2 .stage-b')).screenshot({ path: '0402-light-s2.png' });
  await b.close();
})();
