import type { components } from "../../../hooks/api/schema.d.ts";

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
        {startAt.toLocaleString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
        {" - "}
        {endAt.toLocaleString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
      <p class="text-sm">
        {program.description || ""}
      </p>
    </div>
  );
}
