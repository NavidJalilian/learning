const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, sc] of [[375, 'dark'], [1280, 'light']]) {
    const c = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: sc, reducedMotion: 'reduce' });
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///home/user/learning/lessons/1206-chat-boss-design-it-live.html'); await p.waitForTimeout(300);
    for (const k of ['lb', 'api', 'sd', 'chat', 'pres', 'kv', 'notif']) await p.click(`#tiles .opt[data-k="${k}"]`);
    await p.locator('#s2 .sim').screenshot({ path: SP + `1206-arch2-${w}.png` });
    for (const k of ['lat', 'pick', 'off', 'dev', 'grp', 'pres', 'fan', 'big', 'ord']) { await p.click(`#mleft .opt[data-k="${k}"]`); await p.click(`#mright .opt[data-k="${k}"]`); }
    await p.locator('#s3pred .opt').first().waitFor();
    await p.locator('#s3pred .opt', { hasText: 'Notification servers' }).click();
    await p.waitForSelector('#s3.cleared');
    await p.locator('#flowWrap').screenshot({ path: SP + `1206-flow-${w}.png` });
    console.log(w, errs.length ? errs : 'ok', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await c.close();
  }
  await b.close();
})();
