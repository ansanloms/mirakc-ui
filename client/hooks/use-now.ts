import { useEffect, useRef, useState } from "react";
import { nowEpochMs } from "../lib/datetime.ts";

/**
 * intervalMs ごとに現在時刻（epoch ミリ秒）を進めて返すフック。
 *
 * 画面遷移なしで表示を時間に追従させたい場面で使う（ライブ視聴中の番組情報など）。
 * 返り値が変わると再 render が走るため、`findAiring()` のような「現在時刻に依存する
 * 導出」が番組境界をまたいだタイミングで更新される。
 *
 * 現在時刻の取得は `getNow` で注入できる（テストで固定するため）。既定は Temporal
 * ベースの `nowEpochMs`。
 */
export function useNow(
  intervalMs: number,
  getNow: () => number = nowEpochMs,
): number {
  // getNow を最新参照で保持し、呼び出し側が毎 render で新しい関数を渡しても
  // interval を張り直さないようにする（張り直すと tick の刻みが乱れる）。
  const getNowRef = useRef(getNow);
  getNowRef.current = getNow;

  const [now, setNow] = useState<number>(() => getNowRef.current());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(getNowRef.current());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
