import { ComponentChildren } from "preact";
import Menu from "../organisms/Menu.tsx";

type Props = {
  children: ComponentChildren;
};

export default function Base({ children }: Props) {
  return (
    <div class={"grid md:grid-cols-[240px_1fr] gap-4"}>
      <div class={"overflow-auto"}>
        <Menu />
      </div>
      <div class={"overflow-auto"}>
        {children}
      </div>
    </div>
  );
}
