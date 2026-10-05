import type { Task } from "../types";
import { LockKeyhole, ScanSearch } from "lucide-react";
import { StatusChip } from "../components/ui";

export interface BoardConfig {
  id: string;
  version: number;
  title: string;
  placeholder: boolean;
}

export interface BoardTaskView {
  id: string;
  title: string;
  state: Task["state"];
  points: number;
}

export interface BoardAdapter {
  config: BoardConfig;
  tasks: BoardTaskView[];
  onTaskSelected: (taskId: string) => void;
}

export function PlaceholderBoard({ adapter }: { adapter: BoardAdapter }) {
  return (
    <section className="board-placeholder" aria-label="棋盘占位接口">
      <div className="board-placeholder__header">
        <div className="board-placeholder__mark">
          <ScanSearch size={22} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">BOARD ADAPTER · V{adapter.config.version}</p>
          <h3>{adapter.config.title}</h3>
        </div>
        <StatusChip tone="warning">占位实现</StatusChip>
      </div>
      <p className="board-placeholder__body">
        正式棋盘视觉尚未接入。任务状态、任务入口和计分数据已经通过独立接口提供。
      </p>
      <div className="board-placeholder__grid">
        {adapter.tasks.slice(0, 6).map((task, index) => (
          <button
            className={`board-cell board-cell--${task.state}`}
            key={task.id}
            onClick={() => adapter.onTaskSelected(task.id)}
            disabled={task.state === "locked"}
            aria-label={`${task.title}，${task.state === "locked" ? "未解锁" : `${task.points} 分`}`}
          >
            {task.state === "locked" ? <LockKeyhole size={18} aria-hidden="true" /> : <span>{index + 1}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
