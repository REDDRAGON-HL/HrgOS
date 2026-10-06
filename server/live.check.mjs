import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createLocalStore } from './store.mjs';
import { createTestServer } from './app.mjs';

test('正式比赛独立鉴权、必须配置真实任务；账本在重启后保留，测试密钥不能操作比赛', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hrgos-live-'));
  const gameAdminKey = 'live-admin-key-test-abcdefghijklmnopqrstuvwxyz'; const testKey = 'test-control-key-abcdefghijklmnopqrstuvwxyz';
  const password = 'fixture-only-credential'; const salt = 'fixture-only-salt';
  const passwordHash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  const liveAccounts = [{ username: 'hrg-staff-01', role: 'staff', salt, passwordHash }, { username: 'fixture-player', role: 'player', teamId: 'team-1', salt, passwordHash }];
  let store = await createLocalStore(directory); let app = await createTestServer({ store, gameAdminKey, testKey, liveAccounts, enabled: true });
  try {
    assert.equal((await app.inject({ method: 'POST', url: '/api/games', headers: { authorization: `Bearer ${testKey}` } })).statusCode, 401);
    const created = await app.inject({ method: 'POST', url: '/api/games', headers: { authorization: `Bearer ${gameAdminKey}` } }); assert.equal(created.statusCode, 201);
    const game = created.json(); assert.equal(game.credentials, undefined);
    const login = async (username, role) => {
      const response = await app.inject({ method: 'POST', url: `/api/games/${game.id}/login`, payload: { username, password, role } }); assert.equal(response.statusCode, 200, response.body); return response.json().token;
    };
    const host = await login('hrg-staff-01', 'staff'); const player = await login('fixture-player', 'player');
    const command = async (token, payload, status = 200) => { const response = await app.inject({ method: 'POST', url: `/api/games/${game.id}/commands`, headers: { authorization: `Bearer ${token}`, 'idempotency-key': crypto.randomUUID() }, payload }); assert.equal(response.statusCode, status, response.body); return response.json(); };
    await command(host, { type: 'transition', status: 'RUNNING' }, 409);
    await command(player, { type: 'game_configure', tasks: [], reason: '越权' }, 403);
    const tasks = Array.from({ length: 25 }, (_, i) => ({ id: `task${i}`, title: `现场任务 ${i}`, brief: '完成现场指定挑战并拍照', points: 5 }));
    await command(host, { type: 'game_configure', tasks, reason: '配置赛事任务' }); await command(host, { type: 'transition', status: 'RUNNING' });
    const card = (await command(host, { type: 'ability_grant', number: 3, teamId: 'team-1', reason: '现场发放' })).card;
    await command(player, { type: 'ability_use', instanceId: card.id }); await command(host, { type: 'correct_score', teamId: 'team-1', points: 15, reason: '现场确认' });
    assert.equal((await app.inject({ method: 'POST', url: `/api/testing/runs/${game.id}/clock`, headers: { authorization: `Bearer ${testKey}` }, payload: { milliseconds: 7200000 } })).statusCode, 404);
    assert.equal((await app.inject({ url: `/api/testing/runs/${game.id}/state`, headers: { authorization: `Bearer ${player}` } })).statusCode, 401);
    await app.close(); await store.close(); store = await createLocalStore(directory); app = await createTestServer({ store, gameAdminKey, testKey, liveAccounts, enabled: true });
    const response = await app.inject({ url: `/api/games/${game.id}/state`, headers: { authorization: `Bearer ${player}` } }); assert.equal(response.statusCode, 200);
    const view = response.json(); assert.equal(view.team.score, 15); assert.equal(view.abilityCards.length, 1); assert.equal(view.tasks.length, 25); assert.equal(view.accounts, undefined); assert.equal(view.ledger, undefined);
  } finally { await app.close(); await store.close(); if (resolve(directory).startsWith(resolve(tmpdir()) + '\\') && directory.includes('hrgos-live-')) await rm(directory, { recursive: true, force: true }); }
});
