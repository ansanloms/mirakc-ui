import type { components } from "../../../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";

type Props = {
  /**
   * 番組。
   */
  program: components["schemas"]["MirakurunProgram"];
};

export default function ProgramItem(props: Props) {
  const startAt = new Date(props.program.startAt);
  const endAt = new Date(props.program.startAt + props.program.duration);

  return (
    <div class={["grid", "gap-2"]}>
      <h2 class="font-bold">
        {props.program.name || ""}
      </h2>
      <p class="text-xs">
        {datetime.format(startAt, "yyyy-MM-dd H:mm")}
        {" - "}
        {datetime.format(endAt, "H:mm")}
      </p>
      {props.program.description && (
        <p class="text-sm">
          {props.program.description}
        </p>
      )}
    </div>
  );
}
