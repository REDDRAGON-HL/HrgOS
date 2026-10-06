import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';

test('后端进程异常退出后从持久数据库恢复账本与最后位置并标为离线', async () => {
  const artifactRoot = path.resolve('artifacts'); await mkdir(artifactRoot, { recursive: true });
  const directory = await mkdtemp(path.join(artifactRoot, 'persistence-check-'));
  const key = 'persistence-check-key-abcdefghijklmnopqrstuvwxyz'; let child;
  const boot = async () => new Promise((resolve, reject) => {
    child = spawn(process.execPath, ['server/start.mjs', '--local'], { cwd: process.cwd(), env: { ...process.env, PORT: '0', TEST_API_ENABLED: 'true', TEST_API_KEY: key, HRG_LOCAL_DATABASE: directory }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const timeout = setTimeout(() => reject(new Error('后端启动超时')), 20000);
    let output = '';
    child.stdout.on('data', bytes => { output += bytes.toString(); const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timeout); resolve(match[0]); } });
    child.stderr.on('data', () => {});
    child.once('exit', code => { clearTimeout(timeout); if (!output.match(/http:\/\/127/)) reject(new Error(`后端启动失败，退出码 ${code}`)); });
  });
  const terminate = async () => { if (!child || child.exitCode !== null) return; const exited = new Promise(resolve => child.once('exit', resolve)); child.kill('SIGKILL'); await exited; };
  let address = await boot();
  const call = async (suffix, token, method = 'GET', body) => {
    const response = await fetch(`${address}/api${suffix}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body) });
    assert.equal(response.status, suffix === '/testing/runs' ? 201 : 200); return response.json();
  };
  try {
    const run = await call('/testing/runs', key, 'POST', {});
    const host = await call(`/testing/runs/${run.id}/login`, '', 'POST', run.credentials.host);
    const player = await call(`/testing/runs/${run.id}/login`, '', 'POST', run.credentials.player);
    const prefix = `/testing/runs/${run.id}`;
    await call(`${prefix}/commands`, host.token, 'POST', { type: 'transition', status: 'RUNNING' });
    await call(`${prefix}/commands`, host.token, 'POST', { type: 'correct_score', teamId: 'team-1', points: 7, reason: '持久化检查' });
    await call(`${prefix}/commands`, player.token, 'POST', { type: 'location', latitude: 30.2, longitude: 120.1, accuracy: 8, capturedAt: Date.now(), foreground: true });
    assert.equal((await call(`${prefix}/state`, player.token)).location.status, 'online');
    await terminate(); address = await boot();
    const recovered = await call(`${prefix}/state`, player.token);
    assert.equal(recovered.team.score, 7); assert.equal(recovered.location.latitude, 30.2); assert.equal(recovered.location.status, 'offline');
  } finally {
    await terminate();
    const target = path.resolve(directory);
    assert(target.startsWith(artifactRoot + path.sep) && target !== artifactRoot);
    await rm(target, { recursive: true, force: true });
  }
});
