import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestServer } from './app.mjs';
import { createLocalStore } from './store.mjs';

const key = 'ability-tests-control-key-abcdefghijklmnopqrstuvwxyz';
const image = { name: 'proof.png', mime: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=' };
async function fixture(action, teamCount = 2) {
  const store = await createLocalStore(); const app = await createTestServer({ store, testKey: key, enabled: true });
  try {
    const run = (await app.inject({ method: 'POST', url: '/api/testing/runs', headers: { authorization: `Bearer ${key}` }, payload: { teamCount } })).json();
    const tokens = {};
    for (const [name, credentials] of Object.entries(run.credentials)) tokens[name] = (await app.inject({ method: 'POST', url: `/api/testing/runs/${run.id}/login`, payload: credentials })).json().token;
    const call = async (role, command, status = 200, idempotencyKey = crypto.randomUUID()) => {
      const response = await app.inject({ method: 'POST', url: `/api/testing/runs/${run.id}/commands`, headers: { authorization: `Bearer ${tokens[role]}`, 'idempotency-key': idempotencyKey }, payload: command });
      assert.equal(response.statusCode, status, response.body); return response.json();
    };
    const state = async (role = 'host') => (await app.inject({ url: `/api/testing/runs/${run.id}/state`, headers: { authorization: `Bearer ${tokens[role]}` } })).json();
    const clock = async milliseconds => {
      const response = await app.inject({ method: 'POST', url: `/api/testing/runs/${run.id}/clock`, headers: { authorization: `Bearer ${key}` }, payload: { milliseconds } });
      assert.equal(response.statusCode, 200, response.body);
    };
    await call('host', { type: 'transition', status: 'RUNNING' });
    await action({ app, run, tokens, call, state, clock });
  } finally { await app.close(); await store.close(); }
}

test('22 张能力卡目录可见，停用卡不能使用，发放权限仅属于工作人员', async () => fixture(async ({ call, state }) => {
  const staff = await state(); assert.equal(staff.abilityCatalog.length, 22);
  assert.equal(staff.abilityCatalog.find(card => card.number === 19).ready, true);
  await call('player', { type: 'ability_grant', number: 3, teamId: 'team-1', reason: '测试' }, 403);
  const granted = await call('host', { type: 'ability_grant', number: 19, teamId: 'team-1', reason: '测试' });
  await call('host', { type: 'ability_configure', number: 19, patch: { enabled: false }, reason: '暂停发放此卡' });
  await call('player', { type: 'ability_use', instanceId: granted.card.id }, 409);
  assert.equal((await state('player')).abilityCards.length, 1);
}));

test('现场卡由目标接收后计时，证据隔离、工作人员结算；下蹲按成员缺少数量扣分', async () => fixture(async ({ call, state, clock }) => {
  const granted = await call('host', { type: 'ability_grant', number: 6, teamId: 'team-2', reason: '现场发放' });
  const { use } = await call('opponent', { type: 'ability_use', instanceId: granted.card.id, targetTeamId: 'team-1' });
  await call('host', { type: 'ability_confirm', useId: use.id, result: 'approve' });
  await clock(60000); assert.equal((await state('player')).abilityUses[0].startedAt, null);
  await call('opponent', { type: 'ability_ack', useId: use.id }, 403);
  await call('player', { type: 'ability_ack', useId: use.id });
  const proof = await call('player', { type: 'ability_submit', useId: use.id, text: '两位成员完成记录', media: image });
  assert(proof.evidence.mediaId);
  assert.equal((await state('opponent')).abilityUses[0].evidence.length, 0);
  await call('player', { type: 'ability_review', useId: use.id, teamId: 'team-1', result: 'approve', counts: { player: 20, member: 18 }, reason: '现场确认' }, 403);
  await call('host', { type: 'ability_review', useId: use.id, teamId: 'team-1', result: 'approve', counts: { player: 20, member: 18 }, reason: '现场确认' });
  assert.equal((await state('player')).team.score, -50);
  await call('host', { type: 'ability_review', useId: use.id, teamId: 'team-1', result: 'approve', counts: { player: 20, member: 18 }, reason: '重复' }, 409);
  const poem = (await call('host', { type: 'ability_grant', number: 4, teamId: 'team-2', reason: '现场发放' })).card;
  const second = (await call('opponent', { type: 'ability_use', instanceId: poem.id, targetTeamId: 'team-1' })).use;
  await call('host', { type: 'ability_confirm', useId: second.id, result: 'approve' }); await call('player', { type: 'ability_ack', useId: second.id });
  await call('host', { type: 'ability_review', useId: second.id, teamId: 'team-1', result: 'reject', reason: '未完成微笑朗诵' });
  assert.equal((await state('player')).team.score, -150);
}));

test('排名透视十分钟到期撤权，暂停冻结计时；榜首转分必须确认且只结算一次', async () => fixture(async ({ app, run, tokens, call, state, clock }) => {
  const grant = async number => (await call('host', { type: 'ability_grant', number, teamId: 'team-1', reason: '现场发放' })).card.id;
  const scan = await call('player', { type: 'ability_use', instanceId: await grant(3) });
  assert.equal(scan.use.status, 'ACTIVE'); assert.equal((await state('player')).liveRanking.length, 2);
  const scoreUrl = `/api/testing/runs/${run.id}/scores/team-2`;
  const readScore = () => app.inject({ url: scoreUrl, headers: { authorization: `Bearer ${tokens.player}` } });
  assert.equal((await readScore()).statusCode, 200);
  await clock(9 * 60000); await call('host', { type: 'transition', status: 'PAUSED' }); await clock(5 * 60000);
  assert.equal((await readScore()).statusCode, 200);
  await call('host', { type: 'transition', status: 'RUNNING' }); await clock(60000);
  assert.equal((await readScore()).statusCode, 403); assert.equal((await state('player')).liveRanking, null);
  await call('host', { type: 'correct_score', teamId: 'team-2', points: 150, reason: '现场基础积分' });
  const use = (await call('player', { type: 'ability_use', instanceId: await grant(5) })).use;
  assert.equal((await state('player')).team.score, 0);
  await call('player', { type: 'ability_confirm', useId: use.id, result: 'approve' }, 403);
  const confirmKey = crypto.randomUUID();
  await call('host', { type: 'ability_confirm', useId: use.id, result: 'approve' }, 200, confirmKey);
  await call('host', { type: 'ability_confirm', useId: use.id, result: 'approve' }, 200, confirmKey);
  await call('host', { type: 'ability_confirm', useId: use.id, result: 'approve' }, 409);
  assert.equal((await state('player')).team.score, 100); assert.equal((await state('opponent')).team.score, 50);
}));

test('时空回返要求真实历史点，冻结保留真实轨迹并产生移动提醒', async () => fixture(async ({ call, state, clock }) => {
  const grant = async number => (await call('host', { type: 'ability_grant', number, teamId: 'team-2', reason: '现场发放' })).card.id;
  const back = await grant(14);
  await call('opponent', { type: 'ability_use', instanceId: back, targetTeamId: 'team-1' }, 409);
  const location = (latitude, longitude) => call('player', { type: 'location', latitude, longitude, accuracy: 3, capturedAt: Date.now(), foreground: true });
  await location(30, 120); await clock(10 * 60000); await location(30.01, 120.01);
  const use = (await call('opponent', { type: 'ability_use', instanceId: back, targetTeamId: 'team-1' })).use;
  assert.equal((await state('player')).abilityUses.find(item => item.id === use.id).returnPosition.latitude, 30);
  assert.equal(use.returnPosition, undefined);
  await call('host', { type: 'ability_confirm', useId: use.id, result: 'approve' }); await call('player', { type: 'ability_ack', useId: use.id });
  await call('host', { type: 'ability_review', useId: use.id, teamId: 'team-1', result: 'approve', reason: '工作人员现场确认实际返回' });
  assert.equal((await state('player')).location.latitude, 30.01);
  const freeze = (await call('opponent', { type: 'ability_use', instanceId: await grant(2), targetTeamId: 'team-1' })).use;
  await call('host', { type: 'ability_confirm', useId: freeze.id, result: 'approve' }); await call('player', { type: 'ability_ack', useId: freeze.id });
  await clock(3000); await location(30.02, 120.01);
  assert.equal((await state('player')).location.latitude, 30.02);
  assert((await state()).abilityUses.find(item => item.id === freeze.id).movementAlerts.length > 0);
}));

test('密钥竞速按服务端接收顺序结算，英文大小写/中英文标点归一，中文语义人工确认', async () => fixture(async ({ call, state, clock, run }) => {
  const grant = (await call('host', { type: 'ability_grant', number: 22, teamId: 'team-1', reason: '竞速测试' })).card;
  const { use } = await call('player', { type: 'ability_use', instanceId: grant.id });
  await call('host', { type: 'ability_confirm', useId: use.id, result: 'approve' }); await call('player', { type: 'ability_ack', useId: use.id });
  await call('player', { type: 'ability_submit', useId: use.id, text: run.abilityAnswer }, 409);
  await call('opponent', { type: 'ability_ack', useId: use.id });
  await call('player', { type: 'ability_submit', useId: use.id, text: 'wrong key' }, 400);
  await call('player', { type: 'ability_submit', useId: use.id, text: run.abilityAnswer.toUpperCase().replace('-', '， — ') });
  await clock(1000);
  const proof = (await call('opponent', { type: 'ability_submit', useId: use.id, text: '倒退，回到前世的领域，向后返回。' })).evidence;
  await call('host', { type: 'ability_settle', useId: use.id, reason: '结算竞速' }, 409);
  await call('host', { type: 'ability_review', useId: use.id, teamId: 'team-2', evidenceId: proof.id, result: 'approve', reason: '现场确认中文语义与标准密钥一致' });
  await call('host', { type: 'ability_settle', useId: use.id, reason: '结算竞速' });
  assert.equal((await state('player')).team.score, 5); assert.equal((await state('opponent')).team.score, -5);
  await call('host', { type: 'ability_settle', useId: use.id, reason: '重复结算' }, 409);
  assert.equal((await state('opponent')).abilityUses[0].evidence.length, 1);
}));

test('隐匿追逐仅在十五分钟有效期内公开位置，成功加五分；圆周率以工作人员确认的小数位计分', async () => fixture(async ({ call, state, clock }) => {
  const grant = async number => (await call('host', { type: 'ability_grant', number, teamId: 'team-1', reason: '现场' })).card.id;
  const hunt = (await call('player', { type: 'ability_use', instanceId: await grant(19) })).use;
  await call('host', { type: 'ability_confirm', useId: hunt.id, result: 'approve' }); await call('player', { type: 'ability_ack', useId: hunt.id });
  await call('player', { type: 'location', foreground: true, latitude: 30, longitude: 120, accuracy: 3, capturedAt: Date.now() });
  assert.equal((await state('opponent')).huntLocations[0].latitude, 30);
  await call('host', { type: 'ability_review', useId: hunt.id, teamId: 'team-1', result: 'approve', reason: '未碰到' }, 409);
  await clock(15 * 60000); assert.equal((await state('opponent')).huntLocations.length, 0);
  await call('host', { type: 'ability_review', useId: hunt.id, teamId: 'team-1', result: 'approve', reason: '现场确认十五分钟未被其他队伍触碰' });
  assert.equal((await state('player')).team.score, 5);
  const pi = (await call('player', { type: 'ability_use', instanceId: await grant(21) })).use;
  await call('host', { type: 'ability_confirm', useId: pi.id, result: 'approve' }); await call('player', { type: 'ability_ack', useId: pi.id }); await call('opponent', { type: 'ability_ack', useId: pi.id });
  await call('player', { type: 'ability_submit', useId: pi.id, text: '三人接力背诵录像，工作人员确认十位' });
  await call('host', { type: 'ability_review', useId: pi.id, teamId: 'team-1', result: 'approve', verifiedDigits: 10, reason: '现场逐位核对' });
  assert.equal((await state('player')).team.score, 15);
}));

test('双手许可随下个审核通过任务消耗，任务重演奖励半分，交换的是待执行任务', async () => fixture(async ({ call, state }) => {
  const grant = async number => (await call('host', { type: 'ability_grant', number, teamId: 'team-1', reason: '现场发放' })).card.id;
  const submitTask = async (taskId, role = 'player') => (await call(role, { type: 'submit', kind: 'task', taskId, regionId: 'stage-a', media: image })).submission;
  const review = async submission => call('host', { type: 'review', submissionId: submission.id, result: 'approve' });
  for (const role of ['player', 'opponent']) await review((await call(role, { type: 'submit', kind: 'arrival', regionId: 'stage-a', media: image })).submission);
  const hands = (await call('player', { type: 'ability_use', instanceId: await grant(8) })).use;
  assert.equal((await state('player')).taskPermissions.twoHands, true);
  await review(await submitTask('T01')); assert.equal((await state('player')).taskPermissions.twoHands, false);
  const redoCard = await grant(12);
  await call('player', { type: 'ability_use', instanceId: redoCard, targetTeamId: 'team-2' }, 409);
  await review(await submitTask('T02', 'opponent'));
  const redo = (await call('player', { type: 'ability_use', instanceId: redoCard, targetTeamId: 'team-2' })).use;
  assert.equal(redo.redoTask.taskId, 'T02');
  await call('host', { type: 'ability_confirm', useId: redo.id, result: 'approve' }); await call('opponent', { type: 'ability_ack', useId: redo.id });
  await call('opponent', { type: 'ability_submit', useId: redo.id, text: '重新完成 T02 的现场证据', media: image });
  await call('host', { type: 'ability_review', useId: redo.id, teamId: 'team-2', result: 'approve', reason: '完成重演' });
  assert.equal((await state('opponent')).team.score, 7.5);
  const swap = (await call('player', { type: 'ability_use', instanceId: await grant(15), targetTeamId: 'team-2' })).use;
  await call('host', { type: 'ability_confirm', useId: swap.id, result: 'approve' }); await call('opponent', { type: 'ability_ack', useId: swap.id });
  await call('opponent', { type: 'ability_swap', useId: swap.id, peerTeamId: 'team-1', ownTaskId: 'T03', peerTaskId: 'T04' });
  assert.equal((await state('player')).activeAssignment.taskId, 'T03');
  await call('player', { type: 'submit', kind: 'task', taskId: 'T05', regionId: 'stage-a', media: image }, 409);
  await review(await submitTask('T03')); assert.equal((await state('player')).activeAssignment, null);
}));

test('合照换分对称记账；其余行为限制按明确时限和默认罚分结算，未到期不能提前通过', async () => fixture(async ({ call, state, clock }) => {
  const grant = async number => (await call('host', { type: 'ability_grant', number, teamId: 'team-1', reason: '现场发放' })).card.id;
  await call('host', { type: 'correct_score', teamId: 'team-1', points: 20, reason: '初始分数' }); await call('host', { type: 'correct_score', teamId: 'team-2', points: 80, reason: '初始分数' });
  const photo = (await call('player', { type: 'ability_use', instanceId: await grant(1), targetTeamId: 'team-2' })).use;
  await call('host', { type: 'ability_confirm', useId: photo.id, result: 'approve' }); await call('opponent', { type: 'ability_ack', useId: photo.id });
  await call('host', { type: 'ability_review', useId: photo.id, teamId: 'team-2', result: 'approve', reason: '未提交照片' }, 409);
  await call('player', { type: 'ability_submit', useId: photo.id, text: '双方队伍现场合照', media: image });
  await call('host', { type: 'ability_review', useId: photo.id, teamId: 'team-2', result: 'approve', reason: '确认双方已碰面合照' });
  assert.equal((await state('player')).team.score, 80); assert.equal((await state('opponent')).team.score, 20);
  for (const [number, minutes, penalty] of [[7, 5, 5], [9, 2, 50], [10, 5, 5], [11, 5, 5], [13, 3, 50], [16, 10, 5], [17, 10, 5], [18, 10, 5]]) {
    const use = (await call('player', { type: 'ability_use', instanceId: await grant(number), targetTeamId: 'team-2' })).use;
    await call('host', { type: 'ability_confirm', useId: use.id, result: 'approve' }); await call('opponent', { type: 'ability_ack', useId: use.id });
    assert.equal(use.definition.durationMs, minutes * 60000);
    if ([7, 9, 10, 16, 17, 18].includes(number)) await call('host', { type: 'ability_review', useId: use.id, teamId: 'team-2', result: 'approve', reason: '提前结束' }, 409);
    const before = (await state('opponent')).team.score; await clock(minutes * 60000);
    await call('host', { type: 'ability_review', useId: use.id, teamId: 'team-2', result: 'reject', reason: '现场确认未遵守' });
    assert.equal((await state('opponent')).team.score, before - penalty);
  }
}));
