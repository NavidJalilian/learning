const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: scheme })).newPage();
    await p.goto('file:///home/user/learning/lessons/1504-drive-upload-download-notify.html'); await p.waitForTimeout(600);
    for (const sel of ['.hero', '#s1', '#s3']) await p.locator(sel).screenshot({ path: `1504-${w}-${sel.replace(/[#.]/g, '')}.png` });
  }
  await b.close();
})();
