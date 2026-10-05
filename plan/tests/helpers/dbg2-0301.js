const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await browser.newContext({ viewport: { width: 375, height: 800 } })).newPage();
  await page.goto('file:///home/user/learning/lessons/0301-rules-of-the-room.html'); await page.waitForTimeout(300);
  const dump = () => page.evaluate(() => { let e = document.querySelector('#dBack'); const o = []; while (e && e !== document.body) { o.push((e.id || e.className) + ':' + Math.round(e.getBoundingClientRect().width)); e = e.parentElement; } return o.join(' < ') + ' | docW ' + document.documentElement.scrollWidth; });
  console.log(await dump());
  await page.click('#dbtns .opt[data-k="do"]'); await page.waitForTimeout(800);
  console.log(await dump());
  await page.click('#dNext .btn'); await page.waitForTimeout(300);
  console.log(await dump());
  await browser.close();
})();
