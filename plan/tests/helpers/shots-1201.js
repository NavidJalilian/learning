const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1201-chat-connections.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme, rm] of [[375, 'dark', 'no-preference'], [1280, 'light', 'no-preference'], [375, 'light', 'reduce']]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: 800 }, colorScheme: scheme, reducedMotion: rm })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(URL); await page.waitForTimeout(7000);
    console.log(w, scheme, rm, 'zzz:', await page.textContent('#zzzN'), errs);
    for (const s of ['.hero', '#s1', '#s2', '#s3', '#s4', '#s5', '#s6', '.foot']) {
      await page.locator(s).first().screenshot({ path: `${SP}1201-${w}-${scheme}-${rm[0]}-${s.replace(/[#.]/g, '')}.png` });
    }
    if (rm === 'reduce') { await page.click('#race'); await page.waitForTimeout(300); await page.locator('#s4 .sim').screenshot({ path: SP + '1201-reduced-race.png' }); }
  }
  await browser.close();
})();
