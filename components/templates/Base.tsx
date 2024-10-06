import { ComponentChildren } from "preact";
import Menu from "../organisms/Menu.tsx";

type Props = {
  children: ComponentChildren;
};

export default function Base({ children }: Props) {
  return (
    <div class={"grid grid-cols-[240px_1fr] gap-4"}>
      <Menu />
      <div>
        {children}
      </div>
    </div>
  );
}
