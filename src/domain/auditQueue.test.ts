import { describe, expect, it } from "vitest";
import { enqueueAuditItem, orderAuditQueue } from "./auditQueue";
import type { AuditItem } from "../types";

function audit(id: string, submittedAt: string): AuditItem {
  return {
    id,
    kind: "普通任务",
    team: "测试队",
    task: "测试任务",
    submittedAt,
    waitingSeconds: 0,
    imageTone: "tone-lake",
    checklist: []
  };
}

describe("审核队列", () => {
  it("始终按提交时间先后排序", () => {
    const result = orderAuditQueue([
      audit("A-3", "14:28:52"),
      audit("A-1", "14:28:16"),
      audit("A-2", "14:28:41")
    ]);

    expect(result.map((item) => item.id)).toEqual(["A-1", "A-2", "A-3"]);
  });

  it("同一秒提交时使用稳定编号排序", () => {
    const result = enqueueAuditItem(
      [audit("A-2", "14:28:41")],
      audit("A-1", "14:28:41")
    );

    expect(result.map((item) => item.id)).toEqual(["A-1", "A-2"]);
  });
});
