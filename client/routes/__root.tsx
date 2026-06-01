import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import BaseTemplate from "../components/templates/Base.tsx";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  // 旧 routes/_app.tsx 相当。全ページ共通のヘッダ (Menu + ColorSchemeToggle) を
  // BaseTemplate で被せ、各ルートを Outlet に流す。
  return (
    <BaseTemplate>
      <Outlet />
    </BaseTemplate>
  );
}
