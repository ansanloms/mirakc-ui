import type { ComponentProps, JSX } from "preact";
import { css } from "twind/css";
import InputText from "../../../atoms/Input/Text.tsx";

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
  const handleSetQuery: JSX.GenericEventHandler<HTMLInputElement> = (
    event,
  ) => {
    props.onChange({
      ...props.inputs,
      query: event.currentTarget.value,
    });
  };

  return (
    <form class="forms">
      <InputText
        value={props.inputs.query}
        onChange={handleSetQuery}
      />
    </form>
  );
}
