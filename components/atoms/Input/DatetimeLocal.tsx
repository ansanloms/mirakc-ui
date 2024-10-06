import type { ComponentProps } from "preact";

type Props = Omit<ComponentProps<"input">, "type">;

export default function InputDatetimeLocal(props: Props) {
  return (
    <input
      type="datetime-local"
      {...props}
    />
  );
}
