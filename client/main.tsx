import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen.ts";
import { fetchAppConfig } from "./lib/api/config.ts";
import { setTimeZone } from "./lib/datetime.ts";

import "./assets/styles/palette.css";
import "./assets/styles/general.css";
import "./assets/styles/layout.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // mirakc のデータは頻繁には変わらないが、視聴・録画状態は鮮度が要る。
      // 既定は控えめにして、必要な query 側で staleTime を上書きする方針。
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
  // watch のサービス選択が「リスト操作由来」か「直リンク」かを history state で
  // 区別するためのカスタムプロパティ (Player の autoplay unmute 判定に使う)。
  interface HistoryState {
    selected?: boolean;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root element not found");
}

// 日時表示のタイムゾーンをサーバ設定 (/api/config) に揃えてから描画する。
// 描画前に 1 度だけ設定すれば初回描画から正しい TZ になり、再 render が要らない。
// 取得に失敗してもブラウザのローカル TZ のまま描画を続け、起動は止めない。
async function bootstrap(root: HTMLElement): Promise<void> {
  try {
    const { timeZone } = await fetchAppConfig();
    setTimeZone(timeZone);
  } catch (e) {
    console.error("failed to load app config; using local time zone:", e);
  }

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

bootstrap(rootElement);
