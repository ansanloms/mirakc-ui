import { ComponentChildren } from "preact";
import Menu from "../organisms/Menu.tsx";
import { css, tw } from "twind/css";

type Props = {
  children: ComponentChildren;
};

const style = {
  pc: css`
display: grid;
grid-template-columns: 12rem 1fr;
`,
  mobile: css`
display: grid;
grid-template-columns: 1fr;
`,
};

export default function Base({ children }: Props) {
  return (
    <div class={[style.mobile, tw`lg:${style.pc}`]}>
      <div class={[]}>
        <Menu />
      </div>
      <div class={[]}>
        {children}
      </div>
    </div>
  );
}
