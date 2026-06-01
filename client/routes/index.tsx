import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main>
      <h1>mirakc-ui</h1>
      <p>rewrite: Hono + TanStack Router/Query on Deno</p>
    </main>
  );
}
