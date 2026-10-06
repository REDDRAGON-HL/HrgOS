import type { UserMode } from "../types";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { loginAccounts, type LoginAccount } from "../data/loginAccounts";

export type LoginAccess = UserMode | "waiting";
export type LoginSession = Pick<LoginAccount, "username" | "role" | "teamId">;

export function resolveLoginAccess(
  mode: UserMode,
  username: string,
  password: string,
  accounts: readonly LoginAccount[] = loginAccounts
): LoginAccess {
  return resolveLoginSession(mode, username, password, accounts)?.role ?? "waiting";
}

export function resolveLoginSession(
  mode: UserMode,
  username: string,
  password: string,
  accounts: readonly LoginAccount[] = loginAccounts
): LoginSession | null {
  const account = accounts.find((candidate) => candidate.username === username && candidate.role === mode);
  if (!account || !password) return null;
  const digest = bytesToHex(sha256(new TextEncoder().encode(`${account.salt}:${password}`)));
  if (digest !== account.passwordHash) return null;
  return { username: account.username, role: account.role, teamId: account.teamId };
}
