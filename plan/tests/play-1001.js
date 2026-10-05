const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1001-notification-channels.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL);
  await page.waitForTimeout(400);
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage).join(',') }));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const ov = async tag => { const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 1) console.log('OVERFLOW', tag, o); };

  /* ---- stage 1 ---- */
  await page.click('#tray .tchip[data-id="tower"]');
  await page.click('.slot[data-lane="sms"]');
  console.log('wrong msg:', await page.textContent('#m1'));
  const MAP = { apns: 'ios', fcm: 'android', twilio: 'sms', nexmo: 'sms', sendgrid: 'email', mailchimp: 'email', smtp: 'email', tower: 'bin' };
  for (const [c, l] of Object.entries(MAP)) {
    if (!(await page.$(`#tray .tchip[data-id="${c}"][aria-pressed="true"]`))) await page.click(`#tray .tchip[data-id="${c}"]`);
    await page.click(`.slot[data-lane="${l}"]`);
  }
  console.log('s1 msg:', await page.textContent('#m1'));
  await page.screenshot({ path: SP + '1001-s1.png' });
  await ov('s1');
  await page.waitForSelector('#s1quiz .opt');
  await clickOpt('#s1quiz', 'Better delivery rates');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume:', await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared') })), await hud());

  /* ---- stage 2 ---- */
  await page.click('#dataTray .tchip[data-id="uid"]');
  await page.click('#dataTray .tchip[data-id="tok"]');
  await page.click('#dataTray .tchip[data-id="pay"]');
  await page.fill('#pTitle', 'Rematch?');
  await page.fill('#pBadge', '3');
  console.log('json:', (await page.textContent('#pJson')).replace(/\s+/g, ' '));
  await page.click('#sendBtn');
  await page.waitForSelector('#nb.show', { timeout: 5000 });
  console.log('banner:', await page.textContent('#nbT'), '| badge', await page.textContent('#bdg'));
  await page.locator('#s2 .flight').screenshot({ path: SP + '1001-s2.png' });
  await ov('s2');
  await page.waitForSelector('#s2pred .opt');
  await clickOpt('#s2pred', 'token is unregistered');
  await page.waitForSelector('#s2quiz .opt', { timeout: 10000 });
  console.log('row7 swept:', await page.evaluate(() => document.querySelector('#devTbl tr[data-r="7"]').className));
  await clickOpt('#s2quiz', 'A device token and a JSON payload');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  await page.click('#pingBtn');
  await page.click('#regSeg button[data-r="CN"]');
  console.log('cn msg:', await page.textContent('#m3'));
  await page.click('#plugs .tchip[data-k="SendGrid"]');
  await page.click('#plugs .tchip[data-k="JPush"]');
  console.log('fix msg:', await page.textContent('#m3'), '| cfg', (await page.textContent('#cfg')).replace(/\n/g, '; '));
  await page.locator('#plugSim').screenshot({ path: SP + '1001-s3.png' });
  await page.click('#swapBtn');
  await page.click('#styleSeg button[data-s="iface"]');
  await page.click('#swapBtn');
  console.log('swap n:', await page.textContent('#swapN'));
  await ov('s3');
  await page.waitForSelector('#s3quiz .opt');
  await clickOpt('#s3quiz', 'JPush');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  for (const b of ['#st1', '#st2', '#st3']) { await page.click(b); await page.waitForSelector(b + '.done', { timeout: 8000 }); }
  console.log('rows:', await page.evaluate(() => [document.querySelectorAll('#uTbl tr').length - 1, document.querySelectorAll('#dTbl tr').length - 1]));
  await page.click('#schD .fld:has-text("user_id")');
  console.log('verdict link:', (await page.textContent('#verdict')).slice(0, 50));
  await page.click('#schU .fld:has-text("country_code")');
  await page.click('#schU .fld:has-text("phone_number")');
  await page.locator('#s4 .stage-b').screenshot({ path: SP + '1001-s4.png' });
  await ov('s4');
  await page.waitForSelector('#s4quiz .opt');
  await clickOpt('#s4quiz', 'many devices');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 boss ---- */
  const ANS = ['APNs', 'FCM', 'SMS', 'Email', 'Email', 'FCM'];
  for (let i = 0; i < 6; i++) {
    await page.locator('#boss .choice .opt', { hasText: ANS[i] }).first().click();
    if (i === 0) await page.locator('#s5').screenshot({ path: SP + '1001-s5.png' });
    await page.click('#boss .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 drill ---- */
  await page.fill('#drill textarea', 'Our system is the provider. It sends a device token plus a JSON payload to APNs for iOS, FCM for Android, Twilio for SMS and SendGrid for email.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await hud(), (await page.textContent('#victory h2')));
  await page.waitForTimeout(800);
  await page.screenshot({ path: SP + '1001-375-dark.png', fullPage: true });
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
