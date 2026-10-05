const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await browser.newContext({ viewport: { width: 375, height: 800 } })).newPage();
  await page.goto('file:///home/user/learning/lessons/0301-rules-of-the-room.html'); await page.waitForTimeout(300);
  await page.evaluate(() => { const c = document.querySelector('#dcard'); ['pointerdown','pointermove','pointerup','pointercancel'].forEach(t => c.addEventListener(t, e => console.log(t, e.clientX))); });
  page.on('console', m => console.log('>', m.text()));
  await page.click('#dbtns .opt[data-k="do"]'); await page.click('#dNext .btn'); await page.locator('#dcard').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  const b = await page.locator('#dcard').boundingBox(); console.log(b);
  const el = await page.evaluate(([x,y]) => { const e = document.elementFromPoint(x,y); return e && (e.id || e.className); }, [b.x + b.width/2, b.y + b.height/2]);
  console.log('hit', el);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 120, b.y + b.height / 2, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(300);
  console.log(await page.evaluate(() => document.querySelector('#dcard').className));
  await browser.close();
})();
