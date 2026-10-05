const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const p = await ctx.newPage(); await p.goto('file:///home/user/learning/lessons/0202-latency-numbers.html'); await p.waitForTimeout(300);
  await p.locator('#z2predict .opt', { hasText: 'About a day' }).click();
  await p.waitForSelector('#z2predict .explain.show');
  await p.locator('#zoomSim').screenshot({ path: 'z-zoom.png' });
  await p.locator('#eraPredict .opt', { hasText: 'The memory bars' }).click();
  await p.waitForSelector('#eraPredict .explain.show');
  await p.click('#lightBtn'); await p.waitForTimeout(200);
  await p.locator('#chart4').screenshot({ path: 'z-chart4.png' });
  await p.locator('.mapbox').screenshot({ path: 'z-map.png' });
  await p.locator('#duelBox .opt', { hasText: 'Memory, by about 2×' }).click();
  await p.waitForSelector('#duelBox .explain.show');
  await p.locator('#s3 .stage-b').screenshot({ path: 'z-s3.png' });
  console.log(JSON.parse(await p.evaluate(() => localStorage.getItem('sdq:v1'))).runs['0202']);
  await b.close();
})();
