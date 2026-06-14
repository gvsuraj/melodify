import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const MAX_VISIBLE = 4;
const DURATION = 3500;
const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const queueRef = useRef<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      const queue = queueRef.current;
      if (filtered.length < MAX_VISIBLE && queue.length > 0) {
        const next = queue.shift()!;
        queueRef.current = queue;
        const t = setTimeout(() => removeToast(next.id), DURATION);
        timersRef.current.set(next.id, t);
        return [...filtered, next];
      }
      return filtered;
    });
  }, []);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = crypto.randomUUID();
      const toast: Toast = { id, message, type };
      setToasts((prev) => {
        if (prev.length < MAX_VISIBLE) {
          const t = setTimeout(() => removeToast(id), DURATION);
          timersRef.current.set(id, t);
          return [...prev, toast];
        }
        queueRef.current = [...queueRef.current, toast];
        return prev;
      });
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
