import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

await mkdir('local-private', { recursive: true });
const keyFile = 'local-private/rules-test-key.txt';
let key;
try { key = (await readFile(keyFile, 'utf8')).trim(); } catch { key = randomBytes(32).toString('hex'); await writeFile(keyFile, key, { mode: 0o600 }); }
if (key.length < 32) throw new Error('本机测试密钥无效，请重新生成 local-private/rules-test-key.txt');
const gameKeyFile = 'local-private/live-game-key.txt';
let gameKey;
try { gameKey = (await readFile(gameKeyFile, 'utf8')).trim(); } catch { gameKey = randomBytes(32).toString('hex'); await writeFile(gameKeyFile, gameKey, { mode: 0o600 }); }
if (gameKey.length < 32) throw new Error('本机比赛管理密钥无效');
const availablePort = async (start, explicit) => {
  for (let port = Number(start); port < Number(start) + (explicit ? 1 : 30); port++) {
    const free = await new Promise(resolve => { const server = createServer(); server.once('error', () => resolve(false)); server.listen(port, '127.0.0.1', () => server.close(() => resolve(true))); });
    if (free) return String(port);
  }
  throw new Error(`端口 ${start} 被占用，请设置 HRG_LAB_WEB_PORT 或 HRG_LAB_API_PORT。`);
};
const apiPort = await availablePort(process.env.HRG_LAB_API_PORT ?? '4001', !!process.env.HRG_LAB_API_PORT);
const webPort = await availablePort(process.env.HRG_LAB_WEB_PORT ?? '3001', !!process.env.HRG_LAB_WEB_PORT);
const children = [];
let closing = false;
const stop = () => { if (closing) return; closing = true; children.forEach(child => child.kill()); };
const start = (args, env) => {
  const child = spawn(process.execPath, args, { env: { ...process.env, ...env }, stdio: 'inherit', windowsHide: true }); children.push(child);
  child.on('error', error => { console.error(error.message); stop(); process.exitCode = 1; });
  child.on('exit', code => { if (!closing) { stop(); process.exitCode = code ?? 1; } }); return child;
};
if (!process.env.HRG_TEST_API_URL) start(['server/start.mjs', '--local'], { PORT: apiPort, TEST_API_ENABLED: 'true', TEST_API_KEY: key, GAME_ADMIN_KEY: gameKey, HRG_LOCAL_DATABASE: `local-private/rules-database-${apiPort}`, FRONTEND_ORIGINS: `http://127.0.0.1:${webPort},http://localhost:${webPort}` });
start(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', webPort, '--strictPort'], { VITE_TEST_API_BASE_URL: process.env.HRG_TEST_API_URL ?? `http://127.0.0.1:${apiPort}` });
console.log(`测试页面：http://127.0.0.1:${webPort}/?test=rules`);
console.log(`本机 API 密钥保存于 ${keyFile}，复制到测试页面后点击“一键执行规则测试”。异地 API 使用部署脚本生成的另一份密钥。`);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, stop);
