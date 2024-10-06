import type { JSX } from "preact";
import * as datetime from "$std/datetime/mod.ts";
import InputDatetimeLocal from "../../../atoms/Input/DatetimeLocal.tsx";

type Inputs = { targetDate: Date };

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
  const handleSetTargetDate: JSX.GenericEventHandler<HTMLInputElement> = (
    event,
  ) => {
    props.onChange({
      ...props.inputs,
      targetDate: new Date(event.currentTarget.value),
    });
  };

  return (
    <form class="forms">
      <InputDatetimeLocal
        value={datetime.format(props.inputs.targetDate, "yyyy-MM-ddTHH:mm")}
        onChange={handleSetTargetDate}
      />
    </form>
  );
}
