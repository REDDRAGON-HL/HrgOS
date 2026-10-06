import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer } from './app.mjs';
import { createLocalStore } from './store.mjs';
import { runRuleSuite } from '../src/testing/ruleSuite.ts';

test('测试接口必须鉴权，赛局状态经数据库保存且按玩家权限读取', async () => {
  const store = await createLocalStore();
  const app = await createTestServer({ store, testKey: 'local-test-key-abcdefghijklmnopqrstuvwxyz', enabled: true });
  try {
    assert.equal((await app.inject({ method: 'POST', url: '/api/testing/runs' })).statusCode, 401);
    const seed = await app.inject({ method: 'POST', url: '/api/testing/runs', headers: { authorization: 'Bearer local-test-key-abcdefghijklmnopqrstuvwxyz' } });
    assert.equal(seed.statusCode, 201);
    const run = seed.json();
    const session = await app.inject({ method: 'POST', url: `/api/testing/runs/${run.id}/login`, payload: run.credentials.player });
    assert.equal(session.statusCode, 200);
    const state = await app.inject({ url: `/api/testing/runs/${run.id}/state`, headers: { authorization: `Bearer ${session.json().token}` } });
    assert.equal(state.statusCode, 200);
    assert.equal(state.json().team.id, 'team-1');
    assert.equal(state.json().teams, undefined);
    assert.equal(state.json().accounts, undefined);
  } finally { await app.close(); await store.close(); }
});

test('一键脚本经真实网络执行规则、定位、媒体、并发及恢复链路', async () => {
  const store = await createLocalStore();
  const key = 'local-test-key-abcdefghijklmnopqrstuvwxyz';
  const app = await createTestServer({ store, testKey: key, enabled: true });
  try {
    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    const report = await runRuleSuite({ baseUrl: address, key });
    assert.equal(report.failed, 0, JSON.stringify(report.results.filter(result => result.status === 'failed')));
    assert.equal(report.manual, 4);
    assert(report.passed >= 25);
  } finally { await app.close(); await store.close(); }
});

test('图寻审核须解锁本队区域并仅创建一次事件，普通任务按 FIFO 唯一计分', async () => {
  const store = await createLocalStore();
  const key = 'local-test-key-abcdefghijklmnopqrstuvwxyz';
  const app = await createTestServer({ store, testKey: key, enabled: true });
  const request = (id, token, command) => app.inject({ method: 'POST', url: `/api/testing/runs/${id}/commands`, headers: { authorization: `Bearer ${token}`, 'idempotency-key': crypto.randomUUID() }, payload: command });
  try {
    const run = (await app.inject({ method: 'POST', url: '/api/testing/runs', headers: { authorization: `Bearer ${key}` } })).json();
    const login = async name => (await app.inject({ method: 'POST', url: `/api/testing/runs/${run.id}/login`, payload: run.credentials[name] })).json().token;
    const player = await login('player'); const host = await login('host');
    assert.equal((await request(run.id, host, { type: 'transition', status: 'RUNNING' })).statusCode, 200);
    assert.equal((await request(run.id, player, { type: 'submit', kind: 'task', regionId: 'stage-a', taskId: 'T01' })).json().code, 'REGION_NOT_UNLOCKED');
  } finally { await app.close(); await store.close(); }
});
