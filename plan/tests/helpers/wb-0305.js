const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///home/user/learning/lessons/0305-boss-run-the-room.html');
    await p.locator('#tiles .opt').first().waitFor();
    for (const k of ['user', 'lb', 'web', 'fanout', 'notif', 'post', 'pcache', 'pdb', 'feedsvc', 'feedcache']) { await p.click(`#tiles .opt[data-k="${k}"]`); }
    await p.waitForTimeout(800);
    await p.locator('#wb').screenshot({ path: `${process.env.S}/0305-wb-fix-${w}.png` });
    console.log(w, 'status', await p.locator('#wbStatus').innerText(), 'log', (await p.locator('#wbLog').innerText()).split('\n').slice(-6).join(' | '), 'errs', errs);
    await ctx.close();
  }
  await b.close();
})();
