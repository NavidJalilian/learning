const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/lessons/0705-boss-mint-it-live.html');
  await p.evaluate(() => { localStorage.setItem('sdq:v1', JSON.stringify({ lessons: { '0705': { xp: 429, stars: 2 } }, runs: {} })); localStorage.setItem('sdq:v1:0705-interview', JSON.stringify({ 1: { min: 8, sig: { req: [7, 8] } }, 6: { min: 0, sig: {}, self: [1,1,1,1,1,1,0,1,1,0].map(Boolean), secs: 84 } })); });
  await p.reload(); await p.waitForTimeout(600);
  await p.locator('#victory').screenshot({ path: '0705-victory.png' });
  await p.locator('#scorecard').screenshot({ path: '0705-scorecard.png' });
  await b.close();
})();
