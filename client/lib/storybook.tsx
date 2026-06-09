import type { Decorator } from "@storybook/react-vite";
import { RouterProvider } from "@tanstack/react-router";
import { createAppMemoryRouter } from "./memory-router.tsx";

/**
 * TanStack Router の `<Link>` / `useNavigate` を使うコンポーネントの story 用
 * デコレータ。最小の memory router を組んで RouterProvider を供給する。
 * router の構築は test-router.tsx と共有の `createAppMemoryRouter` を使う。
 */
export const withRouter: Decorator = (Story) => {
  const router = createAppMemoryRouter(() => <Story />);
  // deno-lint-ignore no-explicit-any
  return <RouterProvider router={router as any} />;
};
