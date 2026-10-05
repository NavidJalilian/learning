const { chromium } = require('playwright');
const D = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('file:///home/user/learning/lessons/1506-drive-boss-design-it-live.html'); await page.waitForTimeout(300);
  await page.locator('#s1open .opt', { hasText: 'Ask questions' }).click();
  for (const q of ['most important', 'Mobile app', 'Which database']) { await page.locator('#qdeck .opt', { hasText: q }).click(); }
  await page.locator('#s1').screenshot({ path: D + `s1-${w}.png` });
  for (const k of ['block', 'cloud', 'cold', 'lb', 'api', 'cache', 'db', 'notif']) await page.click(`#tiles .opt[data-k="${k}"]`);
  await page.click('#tiles .opt[data-k="nosql"]');
  const link = async (a, b) => { await page.click(`#arch .nd[data-k="${a}"]`); await page.click(`#arch .nd[data-k="${b}"]`); };
  for (const [a, b] of [['user', 'block'], ['block', 'cloud'], ['user', 'lb'], ['lb', 'api'], ['api', 'db'], ['api', 'notif'], ['notif', 'user'], ['api', 'cloud']]) await link(a, b);
  await page.click('#arch .nd[data-k="cache"]');
  await page.locator('#s2 .sim').screenshot({ path: D + `s2-${w}.png` });
  for (const k of ['sync', 'sec', 'cons', 'rev']) { await page.click(`#mleft .opt[data-k="${k}"]`); await page.click(`#mright .opt[data-k="${k}"]`); }
  await page.locator('#mgrid').screenshot({ path: D + `s3-${w}.png` });
  await page.locator('#barrage').screenshot({ path: D + `s4-${w}.png` });
  const SIDE = ['L', 'L', 'R', 'R', 'R'];
  const rows = await page.$$eval('#chiprows .chiprow', rs => rs.map(r => r.dataset.i));
  for (const i of rows.slice(0, 3)) await page.click(`#chiprows .chiprow[data-i="${i}"] .opt[data-s="${SIDE[+i]}"]`);
  await page.waitForTimeout(300);
  await page.locator('#s5 .stage-b').screenshot({ path: D + `s5-${w}.png` });
  console.log('overflow', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await ctx.close();
  }
  await browser.close();
})();
