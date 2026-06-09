import { createFileRoute, redirect } from "@tanstack/react-router";

// channel type を持たない /program は既定 (GR) の番組表へ寄せる。
export const Route = createFileRoute("/program/")({
  beforeLoad: () => {
    throw redirect({
      to: "/program/$channelType",
      params: { channelType: "GR" },
    });
  },
});
