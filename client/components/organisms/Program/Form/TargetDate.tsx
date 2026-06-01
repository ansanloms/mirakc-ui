import type { ChangeEvent } from "react";
import * as datetime from "@std/datetime";
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
  const handleSetTargetDate = (event: ChangeEvent<HTMLInputElement>) => {
    props.onChange({
      ...props.inputs,
      targetDate: new Date(event.currentTarget.value),
    });
  };

  return (
    <form>
      <InputDatetimeLocal
        value={datetime.format(props.inputs.targetDate, "yyyy-MM-ddTHH:mm")}
        onChange={handleSetTargetDate}
      />
    </form>
  );
}
