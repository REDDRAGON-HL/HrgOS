const { chromium } = require('C:/Users/24175/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const accounts = JSON.parse(await fs.readFile(path.join(process.cwd(), 'local-private/accounts-20261006.json'), 'utf8'));
  assert.equal(accounts.length, 19);
  assert.equal(new Set(accounts.map(account => account.password)).size, 19);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const baseUrl = process.env.HRG_TEST_URL || 'http://127.0.0.1:3000';
  const login = async (page, role, username, password) => {
    await page.goto(baseUrl);
    await page.getByRole('tab', { name: role === 'staff' ? '工作人员' : '玩家账号', exact: true }).click();
    await page.getByPlaceholder('请输入账号').fill(username);
    await page.getByPlaceholder('请输入密码').fill(password);
    await page.getByRole('button', { name: '登录', exact: true }).click();
  };
  try {
    await Promise.all(Array.from({ length: 4 }, async (_, worker) => {
      const page = await browser.newPage({ serviceWorkers: 'block' });
      page.on('pageerror', error => errors.push(error.message));
      for (const account of accounts.filter((_, index) => index % 4 === worker)) {
        await login(page, account.role, account.username, account.password);
        await page.locator(account.role === 'staff' ? '.staff-sidebar' : '.player-console').waitFor();
        if (account.role === 'player') {
          assert((await page.locator('.brand-lockup').innerText()).includes(account.teamName));
          assert.equal(await page.locator('.player-scoreline').getAttribute('aria-label'), `${account.teamName}当前信息`);
          const region = { 'team-1': 2, 'team-2': 2, 'team-3': 1, 'team-4': 3, 'team-5': 1 }[account.teamId];
          assert((await page.locator('.photo-preview__base').first().getAttribute('src')).includes(`/region-${region}/`));
        }
        assert.equal(await page.locator(account.role === 'staff' ? '.player-console' : '.staff-sidebar').count(), 0);
        await login(page, account.role === 'staff' ? 'player' : 'staff', account.username, account.password);
        await page.getByText('请等待游戏开始', { exact: true }).waitFor();
        assert.equal(await page.locator('.player-console, .staff-sidebar').count(), 0);
      }
      await page.close();
    }));
    const page = await browser.newPage({ serviceWorkers: 'block' });
    for (const role of ['player', 'staff']) {
      await login(page, role, 'player01', 'demo2026');
      await page.getByText('请等待游戏开始', { exact: true }).waitFor();
    }
    await login(page, 'player', accounts[4].username, 'not-the-password');
    await page.getByText('请等待游戏开始', { exact: true }).waitFor();
    for (const query of ['?preview=player', '?preview=staff']) {
      await page.goto(baseUrl + '/' + query);
      await page.getByPlaceholder('请输入账号').waitFor();
      assert.equal(await page.locator('.player-console, .staff-sidebar').count(), 0);
    }
    const privatePath = 'local-private/accounts-20261006.json';
    const sheetName = encodeURIComponent('失序重奏志愿分组与账号表-20261007.xlsx');
    for (const url of [`${baseUrl}/${privatePath}`, `${baseUrl}/@fs/${process.cwd().replaceAll('\\', '/')}/${privatePath}`, `${baseUrl}/${sheetName}`, `${baseUrl}/@fs/${process.cwd().replaceAll('\\', '/')}/${sheetName}`]) {
      const response = await page.request.get(url);
      assert.equal(response.status(), 403, '开发服务器必须拒绝访问密码清单');
      const body = await response.text();
      assert(accounts.every(account => !body.includes(account.password)));
    }
    assert.deepEqual(errors, []);
    for (const account of accounts.filter(account => account.role === 'player')) {
      await login(page, 'player', `hrg-player-${String(accounts.indexOf(account) - 3).padStart(2, '0')}`, account.password);
      await page.getByText('请等待游戏开始', { exact: true }).waitFor();
    }
    console.log(JSON.stringify({ accounts: 19, staff: 4, players: 15, validLogins: 19, wrongRoleRejected: 19, oldDefaultRevoked: true, oldNumberedAccountsRevoked: true, wrongPasswordRejected: true, previewBypassBlocked: true, privateFilesBlocked: true, pageErrors: errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
