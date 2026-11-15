import assert from "node:assert/strict";
import { test } from "node:test";
import { t } from "./i18n.ts";

test("t: キーで文言を引ける", () => {
  assert.deepStrictEqual(t("notification.test.title"), "テスト通知");
});

test("t: {{var}} を補間する", () => {
  assert.deepStrictEqual(
    t("notification.recording.started.title", { name: "ニュース７" }),
    "録画開始: ニュース７",
  );
  assert.deepStrictEqual(
    t("notification.recording.fallbackName", { programId: 123 }),
    "番組 ID: 123",
  );
});

test("t: 未知のキーはキーをそのまま返す (i18next と同じ挙動)", () => {
  assert.deepStrictEqual(t("notification.missing.key"), "notification.missing.key");
});

test("t: 未指定の変数はプレースホルダのまま残す", () => {
  assert.deepStrictEqual(t("notification.recording.started.title", {}), "録画開始: {{name}}");
});
