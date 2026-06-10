import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";

import Icon from "./Icon.tsx";
import { t } from "../../locales/i18n.ts";
import styles from "./Modal.module.css";

type Props = {
  /** モーダル内に表示する要素。 */
  children: ReactNode;

  /** 表示状況。 */
  open: boolean;

  /** モーダルを閉じた時の処理。 */
  onClose?: () => void;

  /**
   * 配置。center = 中央 (モバイルは下からのシート)、
   * top = 上寄せ (モバイルは全画面)。
   */
  align?: "center" | "top";

  /** 既定の閉じるボタンを隠す (ヘッダ側に閉じ UI を持つ場合)。 */
  hideClose?: boolean;

  /** カード幅 (CSS 値)。未指定なら既定。 */
  width?: string;
};

/**
 * 共有モーダル。native &lt;dialog&gt; をベースに、デザインの surface カード /
 * スクリム / モバイル下シート・全画面を表現する。閉じる経路 (背景クリック /
 * Esc / 閉じるボタン / open=false) はすべて dialog の close イベントに集約し、
 * onClose を一度だけ発火する。
 */
export default function Modal(
  { children, open, onClose, align = "center", hideClose = false, width }:
    Props,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect((): void => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const requestClose = () => {
    dialogRef.current?.close();
  };

  const handleClickDialog = () => {
    if (dialogRef.current?.open) {
      requestClose();
    }
  };

  const handleClickContent = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${
        align === "top" ? styles.alignTop : styles.alignCenter
      }`}
      style={width ? { width } : undefined}
      onClick={handleClickDialog}
      onClose={() => onClose?.()}
    >
      <div className={styles.content} onClick={handleClickContent}>
        {!hideClose && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={requestClose}
            aria-label={t("common.close")}
          >
            <Icon size={16}>close</Icon>
          </button>
        )}
        {children}
      </div>
    </dialog>
  );
}
