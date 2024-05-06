import { ComponentChildren } from "preact";
import Menu from "../organisms/Menu.tsx";
import { css, tw } from "twind/css";

type Props = {
  children: ComponentChildren;
};

const style = {
  pc: css`
grid-template-columns: 12rem 1fr;
`,
  mobile: css`
grid-template-columns: 1fr;
`,
};

export default function Base({ children }: Props) {
  return (
    <div
      class={["relative", "grid", style.mobile, tw`lg:${style.pc}`, "h-screen"]}
    >
      <Menu />
      <div class={["overflow-auto"]}>
        {children}
      </div>
    </div>
  );
}
