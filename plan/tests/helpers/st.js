const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 375, height: 900 }, colorScheme: 'dark' })).newPage();
await p.goto('file:///home/user/learning/lessons/0203-availability-nines.html'); await p.addStyleTag({ content: '.hud{position:static !important}' });
await p.fill('#calcs .calc[data-i="0"] input', '8.77'); await p.locator('#calcs .calc[data-i="0"] .units button[data-u="h"]').click(); await p.locator('#calcs .calc[data-i="0"] .q-check').click();
await p.locator('#stairs').screenshot({ path: __dirname + '/sh-stairs.png' }); await b.close(); })();
