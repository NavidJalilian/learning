const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p.goto('file:///home/user/learning/lessons/1202-chat-high-level-design.html'); await p.waitForTimeout(700);
  for (const id of ['s1', 's2', 's4']) await p.locator('#' + id).screenshot({ path: SP + `1202-d-${id}.png` });
  await b.close();
})();
