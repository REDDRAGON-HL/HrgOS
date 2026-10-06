import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { runRuleSuite } from '../src/testing/ruleSuite.ts';
import { runFeatureReadiness } from '../src/testing/featureReadiness.ts';
import { runAbilitySuite } from '../src/testing/abilitySuite.ts';

const local = process.argv.includes('--local');
const readiness = process.argv.includes('--readiness');
const abilities = process.argv.includes('--abilities');
let app, store;
try {
  let baseUrl = process.env.HRG_TEST_API_URL;
  let key = process.env.TEST_API_KEY;
  if (local) {
    const { createLocalStore } = await import('../server/store.mjs');
    const { createTestServer } = await import('../server/app.mjs');
    key = randomBytes(32).toString('hex'); store = await createLocalStore();
    app = await createTestServer({ store, testKey: key, enabled: true });
    baseUrl = await app.listen({ host: '127.0.0.1', port: 0 });
  }
  if (!baseUrl || !key) throw new Error('请配置 HRG_TEST_API_URL 和 TEST_API_KEY，或运行 npm run test:rules:local 验证本机实现');
  const report = await (abilities ? runAbilitySuite : readiness ? runFeatureReadiness : runRuleSuite)({ baseUrl, key, onResult: result => console.log(`[${result.status}] ${result.id} ${result.title}${result.status === 'failed' ? `：${result.detail}` : ''}`) });
  const output = abilities ? 'artifacts/ability-test-report.json' : readiness ? 'artifacts/feature-readiness-report.json' : 'artifacts/rules-test-report.json';
  await mkdir('artifacts', { recursive: true }); await writeFile(output, JSON.stringify(report, null, 2));
  console.log(`自动通过 ${report.passed}，失败 ${report.failed}，待实机验收 ${report.manual}。报告：${output}`);
  if (local) console.log('本次使用本机 PostgreSQL WASM 引擎验证，不能作为异地 PostgreSQL 已部署的证明。');
  process.exitCode = report.failed ? 1 : 0;
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (app) await app.close(); if (store) await store.close(); }
