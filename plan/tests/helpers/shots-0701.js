const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: process.argv[2] || 'dark', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/lessons/0701-unique-id-scope-and-multi-master.html'); await p.waitForTimeout(400);
  await p.click('#p1opts .opt[data-i="1"]'); await p.click('#insA'); await p.click('#insA'); await p.click('#insB'); await p.waitForTimeout(300);
  await (await p.$('#s1 .stage-b')).screenshot({ path: 'sh-s1.png' });
  for (let i = 0; i < 5; i++) { await p.click(`#qdeck .opt:nth-child(${i + 1})`); await p.waitForTimeout(100); }
  await (await p.$('#s2 .stage-b')).screenshot({ path: 'sh-s2.png' });
  for (let i = 0; i < 4; i++) await p.click(`#srvs .srv:nth-child(${(i % 2) + 1})`);
  await p.waitForSelector('#r3box .opt'); await p.click('#r3box .opt[data-i="0"]'); await p.waitForSelector('#r3box .row .btn.primary'); await p.click('#r3box .row .btn.primary');
  await p.waitForSelector('#r3box .opt'); await p.click('#r3box .opt[data-i="1"]'); await p.waitForSelector('#r3box .row .btn.primary');
  await (await p.$('#s3 .sim')).screenshot({ path: 'sh-s3.png' });
  await (await p.$('#s4 .stage-b')).screenshot({ path: 'sh-s4.png' });
  await (await p.$('#s5 .stage-b')).screenshot({ path: 'sh-s5.png' });
  await b.close();
})();
