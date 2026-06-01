import type { ReactNode } from "react";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import Menu from "../organisms/Menu.tsx";

type Props = {
  children: ReactNode;
};

export default function Base({ children }: Props) {
  return (
    <div className="layout">
      <header className="layout-header">
        <Menu />
        <ColorSchemeToggle />
      </header>
      <div className="layout-content">
        {children}
      </div>
    </div>
  );
}
