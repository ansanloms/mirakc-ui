import type { JSX } from "preact";
import { t } from "../../../../locales/i18n.ts";
import InputText from "../../../atoms/Input/Text.tsx";
import Button from "../../../atoms/Button.tsx";
import styles from "./Query.module.css";

type Inputs = { query?: string };

type Props = {
  /**
   * 入力値。
   */
  inputs: Inputs;

  /**
   * 検索時。
   */
  onSearch: (inputs: Inputs) => void;
};

export default function ProgramFormTargetDate(props: Props) {
  const handleSubmit: JSX.GenericEventHandler<HTMLFormElement> = (
    event,
  ) => {
    event.preventDefault();
    props.onSearch({ ...props.inputs, query: event.currentTarget.query.value });
  };

  return (
    <form class={styles.form} onSubmit={handleSubmit}>
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
