import { createFileRoute, redirect } from "@tanstack/react-router";

// ホームは廃止。番組表 (/program) へリダイレクトする。
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/program" });
  },
});
