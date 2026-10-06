import { createTestServer } from './app.mjs';
import { createLocalStore, createPostgresStore } from './store.mjs';

const local = process.argv.includes('--local');
if (!local && !process.env.DATABASE_URL) throw new Error('异地服务器必须配置 DATABASE_URL；--local 仅用于本机验证');
const store = local ? await createLocalStore(process.env.HRG_LOCAL_DATABASE ?? 'local-private/rules-database') : await createPostgresStore(process.env.DATABASE_URL);
const key = process.env.TEST_API_KEY;
const app = await createTestServer({ store, testKey: key, gameAdminKey: process.env.GAME_ADMIN_KEY, enabled: process.env.TEST_API_ENABLED === 'true', origins: (process.env.FRONTEND_ORIGINS ?? 'http://127.0.0.1:3000,http://localhost:3000').split(',').map(value => value.trim()).filter(Boolean) });
const address = await app.listen({ host: local ? '127.0.0.1' : '0.0.0.0', port: Number(process.env.PORT ?? 4000) });
console.log(`HRG 测试后端已启动：${local ? '本机 PostgreSQL WASM 验证' : '服务器 PostgreSQL'}，${address}`);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await app.close(); await store.close(); process.exit(0); });
