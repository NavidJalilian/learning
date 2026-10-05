const { chromium } = require('playwright');
const SP = __dirname + '/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/lessons/0203-availability-nines.html');
    await p.addStyleTag({ content: '.hud{position:static !important}' });
    await p.locator('#p1').getByRole('button', { name: 'About 8.77 hours', exact: true }).click();
    await p.waitForTimeout(1200);
    await p.locator('#dialSim').screenshot({ path: SP + `sh-${w}-dial.png` });
    await p.locator('#dial .notch[aria-label^="5 nines"]').click(); await p.waitForTimeout(900);
    await p.locator('#dialSim').screenshot({ path: SP + `sh-${w}-dial5.png` });
    await p.fill('#calcs .calc[data-i="0"] input', '8.77'); await p.locator('#calcs .calc[data-i="0"] .units button[data-u="h"]').click(); await p.locator('#calcs .calc[data-i="0"] .q-check').click();
    await p.locator('#s2 .stage-b').screenshot({ path: SP + `sh-${w}-s2.png` });
    await p.locator('#cbox').getByRole('button', { name: /./ }).count();
    await p.locator('#ctabs .btn[data-c="2"]').click();
    await p.locator('#palette .btn[data-k="0"]').click();
    await p.locator('#chain .grp[data-g="1"] .spare').click();
    await p.locator('#rackBtn').click();
    await p.locator('#chain').screenshot({ path: SP + `sh-${w}-chain.png` });
    await p.locator('#s4 .bins').screenshot({ path: SP + `sh-${w}-bins.png` });
    await p.locator('#s4 .sortcard').screenshot({ path: SP + `sh-${w}-sort.png` });
    await p.locator('#deployBtn').click(); await p.locator('#deployBtn').click();
    await p.locator('#s4 .budget').screenshot({ path: SP + `sh-${w}-budget.png` });
    await p.locator('#s5 .stage-b').screenshot({ path: SP + `sh-${w}-boss.png` });
    console.log(w, 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await ctx.close();
  }
  await b.close();
})();
