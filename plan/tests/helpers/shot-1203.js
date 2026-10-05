const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, s] of [[1280, 'light'], [375, 'dark']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: s })).newPage();
    await p.goto('file:///home/user/learning/lessons/1203-chat-storage-and-ids.html'); await p.waitForTimeout(300);
    await p.click('#p2 .opt:has-text("rises sharply")'); await p.waitForSelector('#p2 .explain.show', { timeout: 10000 });
    await (await p.$('#s2 .sim')).screenshot({ path: SP + `1203-s2rdb-${w}.png` });
    await (await p.$('#s1 .sim')).screenshot({ path: SP + `1203-s1-${w}.png` });
  }
  await b.close();
})();
