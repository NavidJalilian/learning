const { chromium } = require('playwright');
const D = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const scheme of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/lessons/0303-blueprint-and-buy-in.html');
    await p.click('#appr .opt[data-a="b"]');
    await p.waitForSelector('#verdict .explain.show');
    await p.locator('#chatSim').screenshot({ path: D + `q0303-chat-${scheme}.png` });
    for (const k of ['client', 'lb', 'web', 'db', 'cache', 'cdn', 'mq']) { await p.click(`#mBoxes .opt[data-box="${k}"]`); await p.click(`#mJobs .opt[data-job="${k}"]`); }
    await p.locator('#s2 .wb').screenshot({ path: D + `q0303-wb-${scheme}.png` });
    await p.locator('#s5').screenshot({ path: D + `q0303-boss-${scheme}.png` });
    await ctx.close();
  }
  await b.close();
})();
