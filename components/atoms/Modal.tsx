import type { JSX } from "preact";
import { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

import Icon from "./Icon.tsx";
import styles from "./Modal.module.css";

type Props = {
  /**
   * モーダル内に表示する要素。
   */
  children: ComponentChildren;

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

  const handleClickDialog: JSX.GenericEventHandler<HTMLDialogElement> = () => {
    if (dialogRef?.current?.open) {
      handleClose();
    }
  };

  const handleClickContent: JSX.GenericEventHandler<HTMLDivElement> = (
    event,
  ) => {
    event.stopPropagation();
  };

  return (
    <dialog
      ref={dialogRef}
      class={styles.dialog}
      onClick={handleClickDialog}
    >
      <div
        class={styles.closeButton}
        onClick={handleClose}
      >
        <Icon size="2rem">close</Icon>
      </div>
      <div class={styles.content} onClick={handleClickContent}>
        {props.children}
      </div>
    </dialog>
  );
}
