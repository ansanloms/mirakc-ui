import type { components } from "../../../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";

type Props = {
  program: components["schemas"]["MirakurunProgram"];
};

export default function ProgramItem({ program }: Props) {
  const startAt = new Date(program.startAt);
  const endAt = new Date(program.startAt + program.duration);

  return (
    <div
      class={[
        "grid",
        "gap-2",
      ]}
    >
      <h2 class="font-bold">
        {program.name || ""}
      </h2>
      <p class="text-xs">
        {datetime.format(startAt, "yyyy-MM-dd H:mm (a)")}
        {" - "}
        {datetime.format(endAt, "H:mm (a)")}
      </p>
      <p class="text-sm">
        {program.description || ""}
      </p>
    </div>
  );
}
