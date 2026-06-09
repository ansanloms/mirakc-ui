import { createFileRoute } from "@tanstack/react-router";

// 番組表のみ (モーダル無し)。レイアウトの <Outlet/> には何も描画しない。
export const Route = createFileRoute("/program/$channelType/")({
  component: () => null,
});
