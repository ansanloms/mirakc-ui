import { type BrowserContext, chromium } from "playwright";

// hover:none 環境 (タッチスクリーン PC 等、matchMedia("(any-hover: hover)") が false)
// を isMobile context で再現し、JS (controlsVisible) でプレイヤーの controls が
// 表示されることを検証する。CSS の :hover だけに頼っていた頃はこの環境で controls が
// 出せなかった (回帰防止)。
const BASE_URL = Deno.env.get("E2E_BASE_URL") ?? "http://localhost:5173";

const now = Date.now();
const services = [{
  id: 3273601024,
  serviceId: 1024,
  networkId: 32736,
  type: 1,
  name: "テストＮＨＫ総合",
  channel: { type: "GR", channel: "27" },
}];
const programs = [{
  id: 327360102400001,
  serviceId: 1024,
  networkId: 32736,
  startAt: now - 60000,
  duration: 3600000,
  name: "現在の番組",
  genres: [],
}];

async function mock(ctx: BrowserContext) {
  await ctx.route(
    "**/api/mirakc/services",
    (r) => r.fulfill({ json: services }),
  );
  await ctx.route(
    "**/api/mirakc/programs",
    (r) => r.fulfill({ json: programs }),
  );
  await ctx.route(
    "**/api/mirakc/recording/schedules",
    (r) => r.fulfill({ json: [] }),
  );
  await ctx.route(
    "**/api/transcode/**",
    (r) => r.fulfill({ status: 200, contentType: "video/mp2t", body: "" }),
  );
}

Deno.test("e2e: hover:none 環境でも video タップで controls が表示される", async () => {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ hasTouch: true, isMobile: true });
    await mock(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/watch/3273601024`);
    await page.locator("video").waitFor({ state: "attached", timeout: 5000 });

    // この context では hover が無効 (:hover に頼れない) であることを確認。
    const anyHover = await page.evaluate(() =>
      globalThis.matchMedia("(any-hover: hover)").matches
    );

    const controls = page.locator('[class*="controls"]').first();
    const before = await controls.evaluate((el) =>
      globalThis.getComputedStyle(el).opacity
    );

    // video をタップ → JS の controlsVisible が true になり controls が出る。
    await page.locator("video").tap();
    await page.waitForTimeout(300);
    const after = await controls.evaluate((el) =>
      globalThis.getComputedStyle(el).opacity
    );

    console.log(JSON.stringify({ anyHover, before, after }));
    if (after !== "1") {
      throw new Error(`tap 後も controls が出ていない (opacity=${after})`);
    }
  } finally {
    await browser.close();
  }
});
