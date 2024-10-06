import type { components } from "../../../hooks/api/schema.d.ts";

type Props = {
  /**
   * 番組。
   */
  program: components["schemas"]["MirakurunProgram"];
};

export default function ProgramItem(props: Props) {
  return (
    <dl class={"grid gap-1"}>
      {Object.entries(props.program.extended || {}).map(([k, v]) => (
        <>
          <dt class={"font-bold text-sm"}>{k}</dt>
          <dd class={"ml-4 text-sm"}>{v}</dd>
        </>
      ))}
    </dl>
  );
}
