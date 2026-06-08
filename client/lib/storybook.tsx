import type { Decorator } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

/**
 * TanStack Router の `<Link>` / `useNavigate` を使うコンポーネントの story 用
 * デコレータ。最小の memory router を組んで RouterProvider を供給する。
 * アプリ本体の router (Register) とは別インスタンスなので型は緩める。
 */
export const withRouter: Decorator = (Story) => {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <Story />,
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
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  // deno-lint-ignore no-explicit-any
  return <RouterProvider router={router as any} />;
};
