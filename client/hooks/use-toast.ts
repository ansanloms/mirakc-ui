import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error";

export type ToastState = {
  message: string;
  variant: ToastVariant;
};

/**
 * 自動で消えるトースト表示の状態管理。show で表示し、durationMs 経過で
 * 自動的に消える。連続して show した場合は上書きしタイマーをリセットする。
 */
export function useToast(durationMs = 3000): {
  toast: ToastState | null;
  show: (message: string, variant: ToastVariant) => void;
} {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, variant: ToastVariant) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    setToast({ message, variant });
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, durationMs);
  }, [durationMs]);

  // アンマウント時にタイマーを残さない。
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, show };
}
