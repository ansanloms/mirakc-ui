import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { t } from "../locales/i18n.ts";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useEffect(() => {
    document.title = t("index.title");
  }, []);

  return (
    <main>
      <h1>mirakc-ui</h1>
    </main>
  );
}
