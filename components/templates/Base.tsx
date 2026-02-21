import { ComponentChildren } from "preact";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import Menu from "../organisms/Menu.tsx";

type Props = {
  children: ComponentChildren;
};

export default function Base({ children }: Props) {
  return (
    <div class="layout">
      <header class="layout-header">
        <Menu />
        <ColorSchemeToggle />
      </header>
      <div class="layout-content">
        {children}
      </div>
    </div>
  );
}
