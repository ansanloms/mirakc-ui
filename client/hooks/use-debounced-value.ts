import { useEffect, useState } from "react";

/**
 * 値の変化を `delayMs` だけ間引いて返す。最後の変更から `delayMs` 経過するまで
 * 更新を遅延させる (入力中の連続変化を 1 回に畳む)。重い派生処理 (検索フィルタ
 * 等) を打鍵ごとに走らせないために使う。
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    // 次の変更が来たら前回の予約を破棄する (= 最後の値だけが反映される)。
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
