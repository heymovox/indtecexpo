"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, description?: string, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let idCounter = 0;
function nextId() {
  return `toast-${++idCounter}-${Date.now()}`;
}

const TOAST_STYLES: Record<ToastType, { icon: IconName; bar: string; iconBg: string; iconColor: string }> = {
  success: { icon: "check-circle", bar: "bg-success-500", iconBg: "bg-success-50", iconColor: "text-success-500" },
  error: { icon: "close", bar: "bg-signal-500", iconBg: "bg-signal-50", iconColor: "text-signal-600" },
  info: { icon: "bell", bar: "bg-brand-500", iconBg: "bg-brand-50", iconColor: "text-brand-600" },
  warning: { icon: "alert", bar: "bg-gold-500", iconBg: "bg-gold-50", iconColor: "text-gold-600" },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / toast.duration);
      setProgress(remaining * 100);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        dismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [toast.duration, dismiss]);

  const style = TOAST_STYLES[toast.type];

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-steel-200 bg-white shadow-card-hover transition-all duration-300 ${
        exiting ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
          <Icon name={style.icon} size={18} className={style.iconColor} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-navy-900">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-steel-500">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-md p-1 text-steel-400 transition-colors hover:bg-steel-50 hover:text-steel-600"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
      <div className="h-0.5 w-full bg-steel-100">
        <div
          className={`h-full ${style.bar} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ConfirmModal({
  options,
  onResolve,
}: {
  options: ConfirmOptions;
  onResolve: (confirmed: boolean) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isDanger = options.variant === "danger";

  const close = (result: boolean) => {
    setVisible(false);
    setTimeout(() => onResolve(result), 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => close(false)}
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border border-steel-200 bg-white p-6 shadow-card-hover transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isDanger ? "bg-signal-50" : "bg-brand-50"
            }`}
          >
            <Icon
              name={isDanger ? "alert" : "question"}
              size={22}
              className={isDanger ? "text-signal-600" : "text-brand-600"}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="confirm-title" className="display-sm text-lg text-navy-900">
              {options.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-steel-600">{options.message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => close(false)}
            className="btn btn-outline btn-sm"
          >
            {options.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            autoFocus
            className={`btn btn-sm ${isDanger ? "btn-danger" : "btn-primary"}`}
          >
            {options.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (confirmed: boolean) => void;
  } | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, description?: string, duration = 5000) => {
      const id = nextId();
      setToasts((current) => [...current.slice(-4), { id, type, title, description, duration }]);
    },
    [],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const resolveConfirm = useCallback(
    (result: boolean) => {
      confirmState?.resolve(result);
      setConfirmState(null);
    },
    [confirmState],
  );

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-16 z-[90] flex w-full max-w-sm flex-col gap-3 sm:right-6">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
      {confirmState ? (
        <ConfirmModal options={confirmState.options} onResolve={resolveConfirm} />
      ) : null}
    </ToastContext.Provider>
  );
}
