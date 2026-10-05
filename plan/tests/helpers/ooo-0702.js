const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/learning/lessons/0702-uuid-and-ticket-server.html');
  for (const a of ['uuid', 'ticket', 'multi', 'uuid', 'ticket', 'uuid']) { await p.click(`#boss .choice .opt[data-c="${a}"]`); await p.locator('#boss .row .btn.primary').click(); }
  await p.waitForFunction(() => document.querySelector('#s5').classList.contains('cleared'));
  await p.keyboard.press('Tab');
  console.log('s5 cleared first; s1..s4 cleared?', await p.evaluate(() => [1,2,3,4].map(n => document.querySelector('#s'+n).classList.contains('cleared'))), 'errors', errs);
  await b.close();
})();
