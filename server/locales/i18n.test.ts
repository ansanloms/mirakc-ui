import { assertEquals } from "@std/assert";
import { t } from "./i18n.ts";

Deno.test("t: キーで文言を引ける", () => {
  assertEquals(t("notification.test.title"), "テスト通知");
});

Deno.test("t: {{var}} を補間する", () => {
  assertEquals(
    t("notification.recording.started.title", { name: "ニュース７" }),
    "録画開始: ニュース７",
  );
  assertEquals(
    t("notification.recording.fallbackName", { programId: 123 }),
    "番組 ID: 123",
  );
});

Deno.test("t: 未知のキーはキーをそのまま返す (i18next と同じ挙動)", () => {
  assertEquals(t("notification.missing.key"), "notification.missing.key");
});

Deno.test("t: 未指定の変数はプレースホルダのまま残す", () => {
  assertEquals(
    t("notification.recording.started.title", {}),
    "録画開始: {{name}}",
  );
});
