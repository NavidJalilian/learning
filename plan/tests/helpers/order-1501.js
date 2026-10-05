const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file:///home/user/learning/lessons/1501-drive-scope-and-apis.html');
  for (let k = 0; k < 5; k++) { await page.locator('#boss .choice .opt').first().click(); await page.locator('#boss .btn.primary').click(); }
  console.log('s5 cleared first:', await page.evaluate(() => document.querySelector('#s5').classList.contains('cleared')), 'hearts', await page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length));
  await page.click('#fillBtn');
  await page.locator('#abox button', { hasText: 'Shard files' }).click();
  await page.locator('#abox button', { hasText: 'Round 2' }).click();
  await page.locator('#abox button', { hasText: 'Every file' }).click();
  await page.locator('#abox button', { hasText: 'Move the files' }).click();
  await page.locator('#abox button', { hasText: 'Take Region' }).click();
  await page.locator('#abox button', { hasText: 'Round 3' }).click();
  await page.locator('#arch g[role="button"][aria-label^="Web server"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#spof button', { hasText: 'One bigger' }).click();
  await page.locator('#arch g[role="button"][aria-label^="MySQL"]').focus();
  await page.keyboard.press(' ');
  await page.locator('#spof button', { hasText: 'Move it off' }).click();
  await page.locator('#s4quiz button', { hasText: 'It survives' }).click();
  await page.waitForTimeout(1200);
  console.log('cleared:', await page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage)));
  await page.evaluate(() => document.querySelector('#s4').scrollIntoView()); await page.waitForTimeout(300);
  await page.screenshot({ path: 'desk-s4.png' });
  console.log('errors', errs);
  await browser.close();
})();
