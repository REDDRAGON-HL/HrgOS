import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function secureEqual(a, b) {
  const left = Buffer.from(String(a ?? '')); const right = Buffer.from(String(b ?? ''));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAccounts() {
  const credentials = {};
  const accounts = [
    { id: 'player', username: 'test-leader-1', role: 'player', teamId: 'team-1', leader: true },
    { id: 'member', username: 'test-member-1', role: 'player', teamId: 'team-1', leader: false },
    { id: 'opponent', username: 'test-leader-2', role: 'player', teamId: 'team-2', leader: true },
    { id: 'host', username: 'test-host', role: 'staff', manage: true, review: true, locations: true },
    { id: 'reviewer', username: 'test-reviewer', role: 'staff', manage: true, review: true, locations: false },
    { id: 'tracker', username: 'test-tracker', role: 'staff', manage: false, review: false, locations: true }
  ].map(account => {
    const password = randomBytes(18).toString('base64url'); const salt = randomBytes(16).toString('hex');
    credentials[account.id] = { username: account.username, password, role: account.role };
    return { ...account, salt, passwordHash: scryptSync(password, salt, 32).toString('hex') };
  });
  return { accounts, credentials };
}

export function verifyPassword(account, password) {
  if (typeof password !== 'string' || password.length > 200) return false;
  const salt = account?.salt ?? 'nonexistent-account';
  const hash = scryptSync(password, salt, 32).toString('hex');
  return account && secureEqual(hash, account.passwordHash);
}

export function signSession(runId, accountId, key) {
  const payload = Buffer.from(JSON.stringify({ runId, accountId, expiry: Date.now() + 2 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', key).update(payload).digest('base64url')}`;
}

export function readSession(token, runId, key) {
  const [payload, signature, extra] = String(token ?? '').split('.');
  if (!payload || !signature || extra || !secureEqual(signature, createHmac('sha256', key).update(payload).digest('base64url'))) return null;
  try { const session = JSON.parse(Buffer.from(payload, 'base64url').toString()); return session.runId === runId && session.expiry > Date.now() ? session : null; }
  catch { return null; }
}
