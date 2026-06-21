import { assertEquals } from "@std/assert";
import { createConfigRoutes } from "./config.ts";

Deno.test("GET /: 注入された timeZone を返す", async () => {
  const app = createConfigRoutes({ timeZone: "Asia/Tokyo" });

  const res = await app.request("/");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { timeZone: "Asia/Tokyo" });
});

Deno.test("GET /: 別の timeZone でもそのまま返す", async () => {
  const app = createConfigRoutes({ timeZone: "UTC" });

  const res = await app.request("/");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { timeZone: "UTC" });
});
