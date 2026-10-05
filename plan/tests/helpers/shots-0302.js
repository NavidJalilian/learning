const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0302-ask-before-you-build.html';
const SHOT = __dirname + '/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(FILE); await page.waitForTimeout(300);
    await page.locator('#rPredict .opt[data-p="A"]').click();
    await page.locator('#rRun').click();
    await page.waitForTimeout(4200);
    await page.locator('#race').screenshot({ path: `${SHOT}0302-${w}-${scheme}-race-mid.png` });
    await page.locator('#rSkip').click();
    await page.locator('#rEnd.show').waitFor();
    await page.locator('#s1').screenshot({ path: `${SHOT}0302-${w}-${scheme}-s1.png` });
    await page.locator('#s2 .qc').nth(0).click(); await page.locator('#s2 .qc').nth(1).click();
    await page.locator('#s2 .sim').screenshot({ path: `${SHOT}0302-${w}-${scheme}-s2.png` });
    await page.locator('#asks .opt').first().click(); await page.waitForTimeout(600);
    await page.locator('#replies .opt[data-kind="silent"]').click();
    await page.locator('#asks .opt').first().click(); await page.waitForTimeout(600);
    await page.locator('#s3 .sim').screenshot({ path: `${SHOT}0302-${w}-${scheme}-s3.png` });
    await page.locator('#pile .chipb', { hasText: '10M DAU' }).click();
    await page.locator('#slots .slot[data-k="traffic"]').click();
    await page.locator('#pile .chipb:not(.used)').first().click();
    await page.locator('#s4').screenshot({ path: `${SHOT}0302-${w}-${scheme}-s4.png` });
    await page.locator('#s5').screenshot({ path: `${SHOT}0302-${w}-${scheme}-s5.png` });
    await ctx.close();
  }
  await browser.close();
})();
