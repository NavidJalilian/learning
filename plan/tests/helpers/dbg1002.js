const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await page.goto('file:///home/user/learning/lessons/1002-notification-high-level-design.html'); await page.waitForTimeout(300);
  await page.evaluate(() => { document.querySelector('#crack').style.display='block'; document.querySelector('#box1 g g[visibility]') });
  await page.evaluate(() => { [...document.querySelectorAll('#box1 g')].forEach(g => { if (g.getAttribute('visibility')==='hidden') g.setAttribute('visibility','visible'); }); });
  await page.locator('#box1').scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    console.log(await page.evaluate(() => { const c = document.querySelectorAll('#box1 .mk circle:not(.halo)')[0]; const r = c.getBoundingClientRect(); const s=document.querySelector('#box1').getBoundingClientRect(); return [r.x, r.y, r.width, r.height, s.top, scrollY]; }));
    await page.waitForTimeout(100);
  }
  await b.close();
})();
