import { useCallback, useRef, useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { ToastStack } from "./components/ui";
import { initialAuditQueue, initialCards, initialMessages, initialTasks, teams as initialTeams } from "./data/mock";
import { enqueueAuditItem } from "./domain/auditQueue";
import { PlayerApp } from "./player/PlayerApp";
import { StaffApp } from "./staff/StaffApp";
import type { AuditItem, GameCard, GameMessage, Task, TeamStatus, ToastState, UserMode } from "./types";

function nowLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
}

function getPreviewMode(): UserMode | null {
  const preview = new URLSearchParams(window.location.search).get("preview");
  return preview === "player" || preview === "staff" ? preview : null;
}

export default function App() {
  const [mode, setMode] = useState<UserMode | null>(getPreviewMode);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [cards, setCards] = useState<GameCard[]>(initialCards);
  const [messages, setMessages] = useState<GameMessage[]>(initialMessages);
  const [auditQueue, setAuditQueue] = useState<AuditItem[]>(initialAuditQueue);
  const [teams, setTeams] = useState<TeamStatus[]>(initialTeams);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((toast: Omit<ToastState, "id">) => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  const handleSubmitTask = (taskId: string, filename: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    setTasks((current) => current.map((item) => (
      item.id === taskId
        ? { ...item, state: "pending", pendingCount: (item.pendingCount ?? 0) + 1 }
        : item
    )));
    setAuditQueue((current) => enqueueAuditItem(current, {
        id: `A-${111 + current.length}`,
        kind: "普通任务",
        team: "Phigros队",
        task: task.title,
        submittedAt: `${nowLabel()}:00`,
        waitingSeconds: 0,
        imageTone: task.imageTone,
        checklist: ["符合任务画面要求", "包含有效队伍信息", "为活动现场原图"]
      }));
    setMessages((current) => [
      {
        id: `M-${Date.now()}`,
        type: "review",
        title: "提交已进入审核队列",
        body: `“${task.title}”的图片 ${filename} 已按提交时间排队。`,
        time: nowLabel(),
        unread: true
      },
      ...current
    ]);
    notify({ tone: "success", title: "提交成功", body: "已按服务器时间加入审核队列。" });
  };

  const handleUseCard = (cardId: string, target: string) => {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;
    setCards((current) => current
      .map((item) => item.id === cardId ? { ...item, uses: item.uses - 1 } : item)
      .filter((item) => item.uses > 0));
    setMessages((current) => [
      {
        id: `M-${Date.now()}`,
        type: "card",
        title: card.needsConfirmation ? "道具卡等待确认" : "道具卡已生效",
        body: `“${card.name}”已对${target}使用。${card.needsConfirmation ? "工作人员确认后生效。" : "效果已写入活动账本。"}`,
        time: nowLabel(),
        unread: true
      },
      ...current
    ]);
    notify({
      tone: card.needsConfirmation ? "warning" : "success",
      title: card.needsConfirmation ? "等待工作人员确认" : "道具卡已生效",
      body: `${card.name} → ${target}`
    });
  };

  const handleReview = (itemId: string, result: "approve" | "reject") => {
    const item = auditQueue.find((queueItem) => queueItem.id === itemId);
    if (!item) return;
    setAuditQueue((current) => current.filter((queueItem) => queueItem.id !== itemId));
    setMessages((current) => [
      {
        id: `M-${Date.now()}`,
        type: "review",
        title: result === "approve" ? "任务审核通过" : "任务需要重新提交",
        body: result === "approve"
          ? `“${item.task}”已审核通过，结果已写入账本。`
          : `“${item.task}”已打回；任务完成状态不变，请重新上传照片。`,
        time: nowLabel(),
        unread: true
      },
      ...current
    ]);
    notify({
      tone: result === "approve" ? "success" : "warning",
      title: result === "approve" ? "审核已通过" : "已打回重交",
      body: `${item.team} · ${item.task}`
    });
  };

  const handleFinishTeam = (teamId: string) => {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    setTeams((current) => current.map((item) => item.id === teamId
      ? {
          ...item,
          status: "finished",
          region: "工作人员包厢",
          lastSeen: `${nowLabel()} 完赛`,
          color: "#c89217"
        }
      : item));
    notify({ tone: "success", title: "已确认完赛", body: `${team.name}的位置标记已固定为金色。` });
  };

  if (!mode) {
    return (
      <>
        <LoginScreen onLogin={(nextMode) => {
          setMode(nextMode);
          notify({ tone: "success", title: "登录成功", body: nextMode === "player" ? "已进入 Phigros队。" : "已进入工作人员后台。" });
        }} />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  return (
    <>
      {mode === "player" ? (
        <PlayerApp
          tasks={tasks}
          cards={cards}
          messages={messages}
          onLogout={() => setMode(null)}
          onSubmitTask={handleSubmitTask}
          onUseCard={handleUseCard}
          onReadMessage={(messageId) => setMessages((current) => current.map((message) => (
            message.id === messageId ? { ...message, unread: false } : message
          )))}
        />
      ) : (
        <StaffApp
          auditQueue={auditQueue}
          teams={teams}
          onReview={handleReview}
          onFinishTeam={handleFinishTeam}
          onLogout={() => setMode(null)}
        />
      )}
      <ToastStack toasts={toasts} />
    </>
  );
}
