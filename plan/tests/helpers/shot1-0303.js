const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 const p = await (await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
 await p.goto('file:///home/user/learning/lessons/0303-blueprint-and-buy-in.html'); await p.waitForTimeout(300);
 await p.locator('#s1 .challenge').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, 250));
 await p.screenshot({ path: '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q0303-s1-top.png' }); await b.close(); })();
