import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error";

export type ToastState = {
  message: string;
  variant: ToastVariant;

  /** 退場アニメーション中 (molecules/Toast の leaving に渡す)。 */
  leaving: boolean;
};

/**
 * 自動で消えるトースト表示の状態管理。show で表示し、durationMs 経過で
 * leaving (退場アニメーション) に遷移、leaveDurationMs 後にアンマウント
 * する。連続して show した場合は上書きしタイマーをリセットする。
 */
export function useToast(durationMs = 3000, leaveDurationMs = 200): {
  toast: ToastState | null;
  show: (message: string, variant: ToastVariant) => void;
} {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
  };

  const show = useCallback((message: string, variant: ToastVariant) => {
    clearTimers();
    setToast({ message, variant, leaving: false });
    timersRef.current = [
      setTimeout(() => {
        setToast((current) =>
          current === null ? null : { ...current, leaving: true }
        );
      }, durationMs),
      setTimeout(() => {
        setToast(null);
        timersRef.current = [];
      }, durationMs + leaveDurationMs),
    ];
  }, [durationMs, leaveDurationMs]);

  // アンマウント時にタイマーを残さない。
  useEffect(() => {
    return clearTimers;
  }, []);

  return { toast, show };
}
