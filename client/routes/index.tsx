import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_CHANNEL_TYPE } from "../lib/service.ts";

// ホームは廃止。番組表 (既定 channel type) へリダイレクトする。
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      to: "/program/$channelType",
      params: { channelType: DEFAULT_CHANNEL_TYPE },
    });
  },
});
