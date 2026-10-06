const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, s] of [[1280, 'light'], [375, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: s, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/reference/ch13-autocomplete-cheatsheet.html'); await p.waitForTimeout(300);
    const ds = await p.$$('.diagram');
    for (let i = 0; i < ds.length; i++) await ds[i].screenshot({ path: `cs13-d${i}-${w}-${s}.png` });
    await p.screenshot({ path: `cs13-top-${w}-${s}.png` });
    await ctx.close();
  }
  await b.close();
})();
