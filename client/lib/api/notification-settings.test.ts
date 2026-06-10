import { describe, expect, it } from "vitest";
import {
  fetchNotificationSettings,
  saveNotificationSettings,
  sendTestNotification,
} from "./notification-settings.ts";

const settings = {
  url: "https://ntfy.sh/mirakc-rec",
  token: "tk",
  onStart: true,
  onEnd: false,
};

describe("notification-settings api client", () => {
  it("fetchNotificationSettings: GET の JSON を返す", async () => {
    const fetchFn = ((requestUrl: RequestInfo | URL) => {
      expect(String(requestUrl)).toBe("/api/notification-settings");
      return Promise.resolve(Response.json(settings));
    }) as typeof fetch;

    expect(await fetchNotificationSettings(fetchFn)).toEqual(settings);
  });

  it("saveNotificationSettings: PUT して保存結果を返す", async () => {
    const fetchFn = ((requestUrl: RequestInfo | URL, init?: RequestInit) => {
      expect(String(requestUrl)).toBe("/api/notification-settings");
      expect(init?.method).toBe("PUT");
      expect(JSON.parse(String(init?.body))).toEqual(settings);
      return Promise.resolve(Response.json(settings));
    }) as typeof fetch;

    expect(await saveNotificationSettings(settings, fetchFn)).toEqual(
      settings,
    );
  });

  it("sendTestNotification: POST /test に url/token を送る", async () => {
    const fetchFn = ((requestUrl: RequestInfo | URL, init?: RequestInit) => {
      expect(String(requestUrl)).toBe("/api/notification-settings/test");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        url: settings.url,
        token: settings.token,
      });
      return Promise.resolve(Response.json({ ok: true }));
    }) as typeof fetch;

    await sendTestNotification(
      { url: settings.url, token: settings.token },
      fetchFn,
    );
  });

  it("エラー応答は throw する", async () => {
    const fetchFn =
      (() =>
        Promise.resolve(new Response("ng", { status: 502 }))) as typeof fetch;

    await expect(fetchNotificationSettings(fetchFn)).rejects.toThrow();
    await expect(saveNotificationSettings(settings, fetchFn)).rejects
      .toThrow();
    await expect(sendTestNotification({ url: "x", token: "" }, fetchFn))
      .rejects.toThrow();
  });
});
