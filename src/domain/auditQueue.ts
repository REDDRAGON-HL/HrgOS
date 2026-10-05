import type { AuditItem } from "../types";

function toSortableSeconds(time: string) {
  const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

export function orderAuditQueue(items: AuditItem[]) {
  return [...items].sort((left, right) => {
    const timeDifference = toSortableSeconds(left.submittedAt) - toSortableSeconds(right.submittedAt);
    return timeDifference || left.id.localeCompare(right.id, "zh-CN");
  });
}

export function enqueueAuditItem(queue: AuditItem[], item: AuditItem) {
  return orderAuditQueue([...queue, item]);
}
