const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1503-drive-metadata-and-conflicts.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL);
  await page.waitForTimeout(300);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); return d.runs && d.runs['1503'] ? d.runs['1503'].xp : (d.lessons && d.lessons['1503'] ? 'done:' + d.lessons['1503'].xp : 0); });
  const waitSave = async () => { await page.waitForFunction(() => !document.querySelector('#saveBtn').disabled, null, { timeout: 20000 }); };

  // ---- stage 1
  await page.click('#saveBtn'); await page.waitForTimeout(100); await waitSave();
  console.log('s1 after save 1:', await page.textContent('#tt'));
  await (await page.$('#s1 .sim')).screenshot({ path: SP + '1503-s1-split.png' });
  await page.click('#code1 button.ln[data-k="A"]');
  await page.click('#fixBox .opt:has-text("Delete")');
  await page.click('#saveBtn'); await page.waitForTimeout(100); await waitSave();
  console.log('s1 after save 2:', await page.textContent('#tt'));
  await page.click('#dbSeg button[data-m="nosql"]');
  await page.click('#saveBtn'); await page.waitForTimeout(100); await waitSave();
  console.log('s1 after save 3:', await page.textContent('#tt'));
  await (await page.$('#s1 .sim')).screenshot({ path: SP + '1503-s1-nosql.png' });
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await page.click('#s1quiz .opt:has-text("ACID")');
  await (await page.$('#bugBox')).screenshot({ path: SP + '1503-s1-bug.png' });
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('stage 1 cleared, xp', await xp());

  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(400);
  console.log('resume banner:', await page.isVisible('.banner.resume'), 's1 cleared after reload:', await page.isVisible('#s1.cleared'));

  // ---- stage 2
  const MAP = { user_name: 'user', push_id: 'device', last_logged_in_at: 'device', owner_id: 'namespace', relative_path: 'file', is_directory: 'file', latest_version: 'file', checksum: 'file', file_id: 'file_version', version_number: 'file_version', file_version_id: 'block', block_order: 'block' };
  // one wrong placement first (no heart expected)
  await page.click('#tray .fchip[data-f="block_order"]'); await page.click('#tgrid .tcard[data-t="file"]');
  console.log('wrong-place hint:', await page.textContent('#hint2'));
  for (const [f, t] of Object.entries(MAP)) { await page.click(`#tray .fchip[data-f="${f}"]`); await page.click(`#tgrid .tcard[data-t="${t}"]`); }
  // a reversed link, then the 5 right ones
  await page.click('#tgrid .tcard[data-t="device"]'); await page.click('#tgrid .tcard[data-t="user"]');
  console.log('reversed-link hint:', await page.textContent('#hint2'));
  for (const [a, b] of [['user', 'device'], ['user', 'namespace'], ['namespace', 'file'], ['file', 'file_version'], ['file_version', 'block']]) {
    await page.click(`#tgrid .tcard[data-t="${a}"]`); await page.click(`#tgrid .tcard[data-t="${b}"]`);
  }
  console.log('ER visible:', await page.isVisible('#er2.on'), 'store visible:', await page.isVisible('#storeBtn'));
  await page.click('#tgrid .tcard[data-t="user"]'); // neutral
  for (const t of ['namespace', 'file', 'file_version', 'block']) await page.click(`#tgrid .tcard[data-t="${t}"]`);
  await page.click('#storeBtn');
  console.log('trace log:', (await page.textContent('#log2')).slice(0, 200));
  await page.waitForTimeout(1300);
  await (await page.$('#s2 .stage-b')).screenshot({ path: SP + '1503-s2.png' });
  await page.waitForSelector('#s2quiz .opt', { timeout: 5000 });
  await page.click('#s2quiz .opt:has-text("read-only")');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('stage 2 cleared, xp', await xp());

  // ---- stage 3
  await page.click('#p3 .opt:has-text("processed first")');
  await page.waitForSelector('#p3 .opt:has-text("sees both copies")', { timeout: 15000 });
  await page.click('#p3 .opt:has-text("sees both copies")');
  await page.waitForSelector('#resolve.on', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.waitForTimeout(1200);
  await (await page.$('#s3 .sim')).screenshot({ path: SP + '1503-s3.png' });
  await (await page.$('#resolve')).screenshot({ path: SP + '1503-s3b.png' });
  await page.click('#resBtns button[data-r="merge"]');
  console.log('vrows:', await page.textContent('#vrows'));
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await page.click('#s3quiz .opt:has-text("vanish")');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('stage 3 cleared, xp', await xp());

  // ---- stage 4 boss
  for (const k of ['inv', 'acid', 'join', 'first']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .q-arena .row .btn.primary');
  }
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('stage 4 cleared, xp', await xp());

  // ---- stage 5 drill
  await page.fill('#drill textarea', 'Metadata needs strong consistency so I would use a relational database with ACID, invalidate the cache on write, keep versions append only, rebuild from ordered blocks, and first processed write wins with a conflict showing both copies.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 8000 });
  console.log('VICTORY shown:', await page.textContent('#victory h2'));
  const store = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['1503']);
  console.log('saved lesson:', JSON.stringify(store));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX:', ov);
  await page.screenshot({ path: SP + '1503-full.png', fullPage: true });
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
