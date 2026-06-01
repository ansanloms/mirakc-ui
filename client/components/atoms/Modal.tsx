import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";

import Icon from "./Icon.tsx";
import { t } from "../../locales/i18n.ts";
import styles from "./Modal.module.css";

type Props = {
  /**
   * モーダル内に表示する要素。
   */
  children: ReactNode;

  /**
   * 表示状況。
   */
  open: boolean;

  /**
   * モーダルを閉じた時の処理。
   */
  onClose?: () => void;
};

export default function Modal(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleClose = () => {
    dialogRef?.current?.close();
    if (props.onClose) {
      props.onClose();
    }
  };

  useEffect((): void => {
    if (props.open) {
      dialogRef?.current?.showModal();
    } else {
      dialogRef?.current?.close();
    }
  }, [props.open]);

  const handleClickDialog = () => {
    if (dialogRef?.current?.open) {
      handleClose();
    }
  };

  const handleClickContent = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleClickDialog}
    >
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleClose}
        aria-label={t("common.close")}
      >
        <Icon size="2rem">close</Icon>
      </button>
      <div className={styles.content} onClick={handleClickContent}>
        {props.children}
      </div>
    </dialog>
  );
}
