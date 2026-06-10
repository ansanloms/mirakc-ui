import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  // 共通ヘッダ (旧 Menu) は廃止。各ページ (/program・/watch) が自前のツールバー /
  // トップバーを持つため、root は Outlet を流すだけ。
  return <Outlet />;
}
