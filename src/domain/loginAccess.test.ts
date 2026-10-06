import { describe, expect, it } from "vitest";
import { resolveLoginAccess, resolveLoginSession } from "./loginAccess";
import { loginAccounts, type LoginAccount } from "../data/loginAccounts";
import type { UserMode } from "../types";

const fixtures: readonly LoginAccount[] = [
  { username: "test-player", role: "player", teamId: "team-3", salt: "test-salt", passwordHash: "5377f67f4a8c229442bc6b166af7ef6de20c59110fdeba9d92d5d7077821e840" },
  { username: "test-staff", role: "staff", salt: "test-salt", passwordHash: "5377f67f4a8c229442bc6b166af7ef6de20c59110fdeba9d92d5d7077821e840" }
];

describe("活动账号登录权限", () => {
  it("20 个玩家按账号顺序分成 5 队，每队 4 人；工作人员不参与分组", () => {
    const expected = [
      ["team-1", ["01", "02", "03", "04"]],
      ["team-2", ["05", "06", "07", "08"]],
      ["team-3", ["09", "10", "11", "12"]],
      ["team-4", ["13", "14", "15", "16"]],
      ["team-5", ["17", "18", "19", "20"]]
    ] as const;
    for (const [teamId, numbers] of expected) {
      expect(loginAccounts.filter((account) => account.teamId === teamId).map((account) => account.username))
        .toEqual(numbers.map((number) => `hrg-player-${number}`));
    }
    expect(loginAccounts.filter((account) => account.role === 'staff').every((account) => !account.teamId)).toBe(true);
  });

  it("登录会话携带绑定队伍，不返回密码哈希或盐值；错误凭据不返回身份", () => {
    expect(resolveLoginSession('player', 'test-player', 'Test-password-2026', fixtures))
      .toEqual({ username: 'test-player', role: 'player', teamId: 'team-3' });
    expect(resolveLoginSession('player', 'test-player', 'wrong', fixtures)).toBeNull();
  });

  it("仅配置 4 个工作人员和 20 个玩家账号，账号与盐值不重复", () => {
    expect(loginAccounts).toHaveLength(24);
    expect(loginAccounts.filter((account) => account.role === "staff")).toHaveLength(4);
    expect(loginAccounts.filter((account) => account.role === "player")).toHaveLength(20);
    expect(new Set(loginAccounts.map((account) => account.username)).size).toBe(24);
    expect(new Set(loginAccounts.map((account) => account.salt)).size).toBe(24);
    expect(new Set(loginAccounts.map((account) => account.passwordHash)).size).toBe(24);
    expect(loginAccounts.every((account) => /^[a-f0-9]{64}$/.test(account.passwordHash))).toBe(true);
    expect(loginAccounts.some((account) => account.username === "player01")).toBe(false);
  });

  it.each<UserMode>(["player", "staff"])("正确凭据只能进入绑定的 %s 身份", (mode) => {
    const username = mode === "player" ? "test-player" : "test-staff";
    expect(resolveLoginAccess(mode, username, "Test-password-2026", fixtures)).toBe(mode);
    const opposite = mode === "player" ? "staff" : "player";
    expect(resolveLoginAccess(opposite, username, "Test-password-2026", fixtures)).toBe("waiting");
  });

  it.each([
    ["test-player", "wrong-password"], ["other-user", "Test-password-2026"],
    ["", ""], ["TEST-PLAYER", "Test-password-2026"], ["test-player ", "Test-password-2026"],
    ["test-player", "Test-password-2026 "], ["test-player", ""]
  ])("错误或变更后的凭据 %s 不放行", (username, password) => {
    for (const mode of ["player", "staff"] as const) {
      expect(resolveLoginAccess(mode, username, password, fixtures)).toBe("waiting");
    }
  });

  it.each<UserMode>(["player", "staff"])("废除原默认凭据，不能进入 %s 界面", (mode) => {
    expect(resolveLoginAccess(mode, "player01", "demo2026")).toBe("waiting");
  });
});
