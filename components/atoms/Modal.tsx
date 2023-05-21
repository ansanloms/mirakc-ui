import type { JSX } from "preact";
import { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { css } from "twind/css";

import Icon from "./Icon.tsx";

type Props = {
  children: ComponentChildren;
  open: boolean;
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

export default function Modal({ children, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleOpen = () => {
    dialogRef?.current?.showModal();
  };

  const handleClose = () => {
    dialogRef?.current?.close();
    if (onClose) {
      onClose();
    }
  };

  useEffect((): void => {
    if (open) {
      handleOpen();
    } else {
      handleClose();
    }
  }, [open]);

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
        {children}
      </div>
    </dialog>
  );
}
