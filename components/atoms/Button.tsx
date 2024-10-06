import type { ComponentProps } from "preact";

type Props = ComponentProps<"button">;

export default function InputDatetimeLocal({ children, ...props }: Props) {
  return (
    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      {...props}
    >
      {children}
    </button>
  );
}
