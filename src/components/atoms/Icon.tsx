import { css } from "twind/css";

type Props = { children: string; size?: number | string; spin?: boolean };

const style = {
  base: css`
font-variation-settings:
  'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 48
`,
};

export default function Icon({ children, size, spin }: Props) {
  return (
    <span
      class={[
        "material-symbols-outlined",
        style.base,
        spin ? "animate-spin" : undefined,
      ]}
      style={{ width: size || "auto", fontSize: size || "auto" }}
    >
      {children}
    </span>
  );
}
