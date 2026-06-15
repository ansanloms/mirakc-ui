import { describe, expect, it } from "vitest";
import {
  addKeywordRule,
  fetchKeywordRules,
  removeKeywordRule,
  updateKeywordRule,
} from "./keyword-rules.ts";

const rule = {
  id: "a",
  keyword: "ニュース",
  channels: [],
  genres: [],
  enabled: true,
  createdAt: 1,
};

const input = {
  keyword: "ニュース",
  from: "2026-01-01",
  to: undefined,
  channels: ["27"],
  genres: [0],
  enabled: true,
};

describe("keyword-rules api client", () => {
  it("fetchKeywordRules: GET /api/keyword-rules の JSON を返す", async () => {
    const fetchFn = ((requestUrl: RequestInfo | URL) => {
      expect(String(requestUrl)).toBe("/api/keyword-rules");
      return Promise.resolve(Response.json([rule]));
    }) as typeof fetch;

    expect(await fetchKeywordRules(fetchFn)).toEqual([rule]);
  });

  it("addKeywordRule: 入力を POST して作成結果を返す", async () => {
    const fetchFn = ((requestUrl: RequestInfo | URL, init?: RequestInit) => {
      expect(String(requestUrl)).toBe("/api/keyword-rules");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body)).keyword).toBe("ニュース");
      return Promise.resolve(Response.json(rule, { status: 201 }));
    }) as typeof fetch;

    expect(await addKeywordRule(input, fetchFn)).toEqual(rule);
  });

  it("updateKeywordRule: PUT /api/keyword-rules/:id を呼ぶ", async () => {
    const fetchFn = ((requestUrl: RequestInfo | URL, init?: RequestInit) => {
      expect(String(requestUrl)).toBe("/api/keyword-rules/a");
      expect(init?.method).toBe("PUT");
      expect(JSON.parse(String(init?.body)).enabled).toBe(true);
      return Promise.resolve(Response.json(rule));
    }) as typeof fetch;

    expect(await updateKeywordRule("a", input, fetchFn)).toEqual(rule);
  });

  it("removeKeywordRule: DELETE /api/keyword-rules/:id を呼ぶ", async () => {
    let requested = "";
    const fetchFn = ((requestUrl: RequestInfo | URL, init?: RequestInit) => {
      requested = String(requestUrl);
      expect(init?.method).toBe("DELETE");
      return Promise.resolve(new Response(null, { status: 204 }));
    }) as typeof fetch;

    await removeKeywordRule("rule-1", fetchFn);
    expect(requested).toBe("/api/keyword-rules/rule-1");
  });

  it("エラー応答は throw する", async () => {
    const fetchFn =
      (() =>
        Promise.resolve(new Response("ng", { status: 500 }))) as typeof fetch;

    await expect(fetchKeywordRules(fetchFn)).rejects.toThrow();
    await expect(addKeywordRule(input, fetchFn)).rejects.toThrow();
    await expect(updateKeywordRule("a", input, fetchFn)).rejects.toThrow();
    await expect(removeKeywordRule("x", fetchFn)).rejects.toThrow();
  });
});
