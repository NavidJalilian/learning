const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 375, height: 900 }, colorScheme: 'dark' })).newPage();
await p.goto('file:///home/user/learning/reference/ch03-framework-cheatsheet.html');
await p.locator('.keynums').screenshot({ path: 'cs03-kn.png' }); await p.locator('#q32 .wide').screenshot({ path: 'cs03-tbl.png' }); await b.close(); })();
