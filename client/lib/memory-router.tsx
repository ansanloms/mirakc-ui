import type { ReactNode } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/**
 * `<Link>` / `useNavigate` を使うコンポーネントを単体で動かすための最小 memory
 * router。`index` を `/` ルートに描画し、アプリの主要パス（/program,
 * /watch/$serviceId）を解決可能にする。テスト（test-router.tsx）と Storybook
 * （storybook.tsx）で共有する。アプリ本体の router (Register) とは別インスタンス。
 */
export function createAppMemoryRouter(index: () => ReactNode) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: index,
  });
  const programRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/program",
    component: () => null,
  });
  const watchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/watch/$serviceId",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([
    indexRoute,
    programRoute,
    watchRoute,
  ]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}
