const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await browser.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' })).newPage();
  await page.goto('file:///home/user/learning/lessons/1501-drive-scope-and-apis.html');
  await page.evaluate(() => document.querySelector('#s4').scrollIntoView());
  // jump straight to round 3 by clicking through
  await page.click('#fillBtn');
  await page.locator('#abox button', { hasText: 'Shard files' }).click();
  await page.locator('#abox button', { hasText: 'Round 2' }).click();
  await page.locator('#abox button', { hasText: 'Every file' }).click();
  await page.locator('#abox button', { hasText: 'Move the files' }).click();
  await page.locator('#abox button', { hasText: 'Take Region' }).click();
  await page.locator('#abox button', { hasText: 'Round 3' }).click();
  const g = page.locator('#arch g[role="button"][aria-label^="Web server"]');
  await g.scrollIntoViewIfNeeded();
  const r = await g.boundingBox();
  console.log(r);
  console.log(await page.evaluate(({x,y}) => { const e = document.elementFromPoint(x,y); return e.tagName + ' ' + e.getAttribute('class') + ' ' + getComputedStyle(e).pointerEvents; }, { x: r.x + r.width/2, y: r.y + r.height/2 }));
  console.log(await g.evaluate(e => e.outerHTML)); console.log(await page.evaluate(() => { const r = document.querySelector("#arch g[role=button] rect").getBoundingClientRect(); const s = document.querySelector("#arch").getBoundingClientRect(); return [r.x, r.y, r.width, r.height, s.x, s.y, s.width, s.height].map(Math.round); }));
  await browser.close();
})();
