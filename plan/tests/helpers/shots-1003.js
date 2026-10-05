const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1003-notification-reliability.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })).newPage();
    await page.goto(URL); await page.waitForTimeout(300);
    await page.addStyleTag({ content: '.hud{display:none!important}' });
    // s1: run log ON + ack before
    await page.click('#logSeg button[data-v="1"]');
    await page.locator('#s1box .opt', { hasText: 'still arrives' }).click();
    await page.waitForSelector('#s1box .explain.show');
    await page.locator('#s1 .sim').screenshot({ path: `${SP}1003-${w}-s1.png` });
    await page.locator('#s1box').screenshot({ path: `${SP}1003-${w}-s1box.png` });
    // s2: run C
    for (const [a, n] of [['1 banner', 'Next: run B'], ['2 banners', 'Next: run C']]) { await page.locator('#s2box .opt', { hasText: a }).click(); await page.waitForSelector('#s2box .explain.show'); await page.locator('#s2box button', { hasText: n }).click(); }
    await page.locator('#s2box .opt', { hasText: '2 banners' }).click(); await page.waitForSelector('#s2box .explain.show');
    await page.locator('#s2 .sim').screenshot({ path: `${SP}1003-${w}-s2.png` });
    // s3 gate + code
    await page.click('#gSend');
    await page.locator('#gate').screenshot({ path: `${SP}1003-${w}-s3gate.png` });
    await page.click('#raceBtn'); await page.waitForSelector('#bugBtn:not([style*="none"])');
    await page.click('#code .cl[data-l="2"]');
    await page.locator('#code').screenshot({ path: `${SP}1003-${w}-s3code.png` });
    // s4
    await page.locator('#tri').screenshot({ path: `${SP}1003-${w}-s4tri.png` });
    await page.click('#boRun'); await page.waitForSelector('#boRun:not([disabled])');
    await page.locator('#s4 .bo').screenshot({ path: `${SP}1003-${w}-s4bo.png` });
    // s5 run phase 1 with 1 worker (fail)
    await page.click('#qRun'); await page.waitForTimeout(300);
    console.log(w, 'p1 fail msg:', await page.textContent('#qmsg'));
    await page.locator('#s5 .sim').screenshot({ path: `${SP}1003-${w}-s5.png` });
    await page.locator('#s6').screenshot({ path: `${SP}1003-${w}-s6.png` });
    console.log(w, 'overflow', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  }
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
