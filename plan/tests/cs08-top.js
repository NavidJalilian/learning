const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 const p = await (await b.newContext({ viewport: { width: 375, height: 1100 }, colorScheme: 'dark' })).newPage();
 await p.goto('file:///home/user/learning/reference/ch08-url-shortener-cheatsheet.html'); await p.waitForTimeout(300);
 await p.screenshot({ path: process.argv[2] }); await b.close(); })();
