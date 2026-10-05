const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p.goto('file:///home/user/learning/lessons/0204-twitter-qps-storage.html');
  for (const k of ['eng','mau','daily','tw','media','keep']) await p.click(`#deck .acard[data-k="${k}"]`);
  await p.waitForTimeout(2500);
  await p.locator('#s1').screenshot({ path: 'q0204-s1-desk.png' });
  await p.locator('#s4').screenshot({ path: 'q0204-s4-desk.png' });
  await b.close();
})();
