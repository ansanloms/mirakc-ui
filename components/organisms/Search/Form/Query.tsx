import type { ComponentProps, JSX } from "preact";
import { t } from "../../../../locales/i18n.ts";
import { css } from "twind/css";
import { useState } from "preact/hooks";
import InputText from "../../../atoms/Input/Text.tsx";
import Button from "../../../atoms/Button.tsx";

type Inputs = { query?: string };

type Props = {
  /**
   * 入力値。
   */
  inputs: Inputs;

  /**
   * 更新時の処理。
   */
  onChange: (inputs: Inputs) => void;
};

export default function ProgramFormTargetDate(props: Props) {
  const handleSubmit: JSX.GenericEventHandler<HTMLFormElement> = (
    event,
  ) => {
    event.preventDefault();
    props.onChange({ ...props.inputs, query: event.currentTarget.query.value });
  };

  return (
    <form class={["forms", "flex", "gap-4"]} onSubmit={handleSubmit}>
      <InputText
        name="query"
        value={props.inputs.query}
      />
      <Button>
        {t("common.search")}
      </Button>
    </form>
  );
}
