import type { JSX } from "preact";
import { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { css } from "twind/css";

import Icon from "./Icon.tsx";

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

const style = {
  dialog: css`
opacity: 0;
position: relative;
padding: 0;
background: transparent;
border: none;
outline: none;

&:modal {
  opacity: 1;
  animation: fadein .25s ease-in;
}

&::backdrop {
  opacity: 0;
  background: rgba(0, 0, 0, 0.5);
}

&:modal::backdrop {
  opacity: 1;
  animation: fadein .25s ease-in;
}

@keyframes fadein {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
`,
  content: css`
margin-top: 2rem;
overflow: auto;
`,
  closeButton: css`
position: absolute;
top: 0;
right: 0;
cursor: pointer;
`,
};

export default function Modal(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleOpen = () => {
    dialogRef?.current?.showModal();
  };

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
    <dialog ref={dialogRef} class={style.dialog} onClick={handleClickDialog}>
      <div class={style.closeButton} onClick={handleClose}>
        <Icon size="2rem">close</Icon>
      </div>
      <div class={style.content} onClick={handleClickContent}>
        {props.children}
      </div>
    </dialog>
  );
}
