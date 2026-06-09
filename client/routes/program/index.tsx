import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_CHANNEL_TYPE } from "../../lib/service.ts";

// channel type を持たない /program は既定の番組表へ寄せる。
export const Route = createFileRoute("/program/")({
  beforeLoad: () => {
    throw redirect({
      to: "/program/$channelType",
      params: { channelType: DEFAULT_CHANNEL_TYPE },
    });
  },
});
