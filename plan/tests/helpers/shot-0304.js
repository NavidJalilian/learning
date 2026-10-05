const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, sch] of [[1280, 'light'], [375, 'dark']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: sch })).newPage();
    await p.goto('file:///home/user/learning/lessons/0304-dive-deep-land-clean.html');
    await p.waitForTimeout(500);
    await p.locator('#s1 .match').screenshot({ path: `q0304-${w}-match.png` });
    await p.locator('#dive').screenshot({ path: `q0304-${w}-dive.png` });
    await p.click('#modeSeg button[data-m="push"]');
    await p.$eval('#fSlider', el => { el.value = 2; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.click('#btnPub'); await p.waitForTimeout(3800);
    await p.locator('#s3 .sim.fo').screenshot({ path: `q0304-${w}-fo.png` });
  }
  await b.close();
})();
