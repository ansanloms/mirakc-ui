import type { components } from "../../../hooks/api/schema.d.ts";
import { css } from "twind/css";
import * as datetime from "$std/datetime/mod.ts";
import { t } from "../../../locales/i18n.ts";
import Icon from "../../atoms/Icon.tsx";
import RecordingItem from "../Recording/Item.tsx";

type Props = {
  program: components["schemas"]["MirakurunProgram"];
  recordingSchedule?: components["schemas"]["WebRecordingSchedule"] | undefined;
  addRecordingSchedule?: (
    program: components["schemas"]["MirakurunProgram"],
  ) => Promise<void>;
  removeRecordingSchedule?: (
    program: components["schemas"]["MirakurunProgram"],
  ) => Promise<void>;
  isDuringScheduling: boolean;
};

const style = {
  container: css`
grid-template-rows: auto auto 1fr auto;
`,
};

export default function ProgramDetail(
  {
    program,
    recordingSchedule,
    addRecordingSchedule,
    removeRecordingSchedule,
    isDuringScheduling,
  }: Props,
) {
  const startAt = new Date(program.startAt);
  const endAt = new Date(program.startAt + program.duration);

  const handleToggleRecordingSchedule = () => {
    if (isDuringScheduling) {
      return;
    }

    if (recordingSchedule) {
      removeRecordingSchedule && removeRecordingSchedule(program);
    } else {
      addRecordingSchedule && addRecordingSchedule(program);
    }
  };

  const toggleRecordingScheduleLabel = isDuringScheduling
    ? ""
    : t(`recording.${recordingSchedule ? "cancel" : "record"}`);

  return (
    <section
      class={[
        style.container,
        "grid",
        "gap-2",
        "items-start",
        "min-h-full",
      ]}
    >
      <h3 class={["font-bold", "text-lg", "mb-4"]}>
        {program.name}
      </h3>
      <p class={["font-normal", "text-sm"]}>
        {datetime.format(startAt, "yyyy-MM-dd H:mm (a)")}
        {" - "}
        {datetime.format(endAt, "H:mm (a)")}
      </p>
      <article class={["grid", "gap-2"]}>
        <p>
          {program.description}
        </p>
        <dl>
          {Object.entries(program.extended || {}).map(([k, v]) => (
            <>
              <dt class={["font-bold", "mt-2"]}>{k}</dt>
              <dd class={["ml-4"]}>{v}</dd>
            </>
          ))}
        </dl>
      </article>
      <article class={["grid", "gap-2"]}>
        {recordingSchedule && (
          <>
            <hr />
            <article>
              <RecordingItem recordingSchedule={recordingSchedule} />
            </article>
          </>
        )}
        {addRecordingSchedule && removeRecordingSchedule && (
          <>
            <hr />
            <button
              onClick={handleToggleRecordingSchedule}
              disabled={isDuringScheduling}
            >
              {isDuringScheduling && <Icon spin={true}>sync</Icon>}
              {toggleRecordingScheduleLabel}
            </button>
          </>
        )}
      </article>
    </section>
  );
}
