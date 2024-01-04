import type { ComponentProps } from "preact";

type Props = Omit<ComponentProps<"input">, "type">;

export default function InputText(props: Props) {
  return (
    <input
      type="text"
      {...props}
    />
  );
}
