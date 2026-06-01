import { type Browser, chromium, type Page } from "playwright";
import { assertEquals } from "@std/assert";

const BASE_URL = Deno.env.get("E2E_BASE_URL") ?? "http://localhost:8000";

const now = Date.now();

const services = [
  {
    id: 3273601024,
    serviceId: 1024,
    networkId: 32736,
    type: 1,
    logoId: 0,
    remoteControlKeyId: 1,
    name: "テストＮＨＫ総合",
    channel: { type: "GR", channel: "27" },
    hasLogoData: false,
  },
];

const programs = [
  {
    id: 327360102400001,
    eventId: 1,
    serviceId: 1024,
    networkId: 32736,
    startAt: now - 60000,
    duration: 3600000,
    isFree: true,
    name: "現在の番組",
    description: "オンエア中",
    genres: [],
  },
];

async function newMockedPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.route(
    "**/api/mirakc/services",
    (r) => r.fulfill({ json: services }),
  );
  await page.route(
    "**/api/mirakc/programs",
    (r) => r.fulfill({ json: programs }),
  );
  await page.route(
    "**/api/mirakc/recording/schedules",
    (r) => r.fulfill({ json: [] }),
  );
  // transcode はストリームを返さず 200 空で良い (要素描画の確認のみ)。
  await page.route(
    "**/api/transcode/**",
    (r) => r.fulfill({ status: 200, contentType: "video/mp2t", body: "" }),
  );
  return page;
}

// 回帰テスト: 多階層ルート (/watch/$serviceId) で asset がロードされ、React が
// マウントしてプレイヤー (video) とサービス一覧が描画される。vite の base を相対
// ("./") に戻すと asset が 404 -> index.html を JS として読み MIME エラーになり、
// このテストが fail する。
Deno.test("e2e: watch/$serviceId でプレイヤーとサービス一覧が表示される", async () => {
  const browser = await chromium.launch();
  try {
    const page = await newMockedPage(browser);
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") {
        errors.push(`[console] ${m.text()}`);
      }
    });
    page.on("pageerror", (e) => {
      errors.push(`[pageerror] ${e.message}`);
    });

    await page.goto(`${BASE_URL}/watch/3273601024`);
    await page.locator("video").waitFor({ state: "attached", timeout: 5000 });

    assertEquals(await page.locator("video").count(), 1);
    assertEquals(await page.getByText("テストＮＨＫ総合").count(), 1);
    assertEquals(errors, []);
  } finally {
    await browser.close();
  }
});
