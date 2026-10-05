const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1302-trie-top-k.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
  const c = await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: scheme, deviceScaleFactor: 2 });
  const p = await c.newPage(); await p.goto(FILE); await p.waitForTimeout(300);
  for (const [wd, n] of [['tree', 4], ['try', 1], ['true', 2], ['toy', 2], ['wish', 4], ['win', 1]]) {
    await p.click(`#wchips .wchip[data-w="${wd}"]`); for (let i = 0; i < n; i++) await p.click('#t1plus'); await p.click('#t1grow');
    await p.waitForFunction(() => document.querySelector('#t1fb').classList.contains('show')); await p.waitForTimeout(150);
  }
  await p.click('#s2worst'); await p.waitForTimeout(4500);
  await p.click('#s3pred .seg[data-q="time"] button[data-v="down"]'); await p.click('#s3pred .seg[data-q="mem"] button[data-v="up"]'); await p.click('#s3lock');
  await p.click('#cacheT'); await p.click('#s3chips .chip:text-is("bes")'); await p.waitForTimeout(1200);
  await p.click('#trie4 g.tn[aria-label^="node be:"]'); await p.waitForTimeout(600);
  await p.addStyleTag({ content: '.hud{display:none!important}' });
  for (const s of ['#s1 .sim', '#s2 .sim', '#s3 .sim', '#s4 .sim']) await (await p.$(s)).screenshot({ path: `${DIR}1302-${w}-${s.slice(1,3)}-sim.png` });
  await c.close();
  }
  await b.close();
})();
