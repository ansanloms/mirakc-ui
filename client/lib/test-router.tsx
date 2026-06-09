import type { ReactNode } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { createAppMemoryRouter } from "./memory-router.tsx";

/**
 * TanStack Router の `<Link>` / `useNavigate` を使うコンポーネントをテストする
 * ための memory router ラッパー。`ui` を `/` ルートで描画する。
 *
 * 戻り値は `@testing-library/react` の `render` 結果。router が描画を解決するまで
 * 一瞬の保留があり得るため、最初の取得は `await screen.findBy...` を使うとよい。
 */
export function renderWithRouter(ui: ReactNode) {
  const router = createAppMemoryRouter(() => ui);
  // deno-lint-ignore no-explicit-any
  return render(<RouterProvider router={router as any} />);
}
