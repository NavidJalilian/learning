const { chromium } = require('playwright');
const D='/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w,scheme] of [[1100,'light'],[375,'dark']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme })).newPage();
  await p.goto('file:///home/user/learning/lessons/0703-snowflake-bit-layout.html'); await p.waitForTimeout(300);
  await p.fill('#shift3','22'); await p.click('#shiftBtn3'); await p.waitForSelector('#st3a.solved');
  await p.fill('#sum3','1586451091225'); await p.click('#sumBtn3'); await p.waitForSelector('#st3c:not([hidden])');
  await p.click('#toyChips .chip[data-v="20"]');
  await p.locator('#s3').screenshot({ path: D+`shot-0703-s3-${scheme}.png` });
  await p.click('#r2box button.opt >> nth=0'); await p.waitForSelector('#r2box .row button.primary',{timeout:15000});
  await p.locator('#s2 .sim').screenshot({ path: D+`shot-0703-s2-${scheme}.png` });
  }
  await b.close();
})();
