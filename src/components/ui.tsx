import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import type { ToastState } from "../types";

export function StatusChip({
  tone = "neutral",
  children
}: {
  tone?: "success" | "warning" | "danger" | "info" | "neutral" | "gold";
  children: ReactNode;
}) {
  return <span className={`status-chip status-chip--${tone}`}>{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Modal({
  title,
  description,
  children,
  onClose
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 150);
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [requestClose]);

  return (
    <div className={`modal-backdrop ${isClosing ? "is-closing" : ""}`} role="presentation" onMouseDown={requestClose}>
      <section
        className={`modal-card ${isClosing ? "is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} className="icon-button modal-close" onClick={requestClose} aria-label="关闭弹窗">
          <X size={20} aria-hidden="true" />
        </button>
        <p className="eyebrow">HRG GAME</p>
        <h2 id="modal-title">{title}</h2>
        {description ? <p className="modal-description" id="modal-description">{description}</p> : null}
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}

export function ToastStack({ toasts }: { toasts: ToastState[] }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "warning" ? TriangleAlert : Info;
        return (
          <div className={`toast toast--${toast.tone}`} key={toast.id}>
            <Icon size={20} aria-hidden="true" />
            <div>
              <strong>{toast.title}</strong>
              <p>{toast.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}
