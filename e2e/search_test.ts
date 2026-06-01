import { type Browser, chromium, type Page } from "playwright";

// e2e は「サーバが E2E_BASE_URL で起動している」ことを前提とする。
// ローカル: `deno task build && deno task start` 後に `deno task test:e2e`。
// API は Playwright の route intercept でモックするため mirakc バックエンドは不要。
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
    startAt: now,
    duration: 3600000,
    isFree: true,
    name: "朝のニュース",
    description: "今日のニュースをお伝えします",
    genres: [],
  },
  {
    id: 327360102400002,
    eventId: 2,
    serviceId: 1024,
    networkId: 32736,
    startAt: now + 3600000,
    duration: 3600000,
    isFree: true,
    name: "アニメ劇場",
    description: "夕方のアニメ",
    genres: [],
  },
];

async function newMockedPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.route("**/api/mirakc/**", (route) => {
    const url = route.request().url();
    if (url.includes("/services")) {
      return route.fulfill({ json: services });
    }
    if (url.includes("/programs")) {
      return route.fulfill({ json: programs });
    }
    if (url.includes("/recording/schedules")) {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ json: {} });
  });
  return page;
}

Deno.test("e2e: 検索フォームに入力して検索すると一致する番組だけが表示される", async () => {
  const browser = await chromium.launch();
  try {
    const page = await newMockedPage(browser);
    await page.goto(`${BASE_URL}/search`);

    // 検索フォームに入力 (controlled input バグの回帰: 打鍵できないと query が空になる)。
    await page.fill('input[name="query"]', "ニュース");
    await page.getByRole("button", { name: "検索" }).click();

    // URL に q が反映される (TanStack Router の navigate)。
    await page.waitForURL(/[?&]q=/);

    // "ニュース" を含む番組だけが表示される。
    await page.getByText("朝のニュース").waitFor({
      state: "visible",
      timeout: 5000,
    });
    const animeCount = await page.getByText("アニメ劇場").count();
    if (animeCount !== 0) {
      throw new Error("query にマッチしない番組が表示されている");
    }
  } finally {
    await browser.close();
  }
});

Deno.test("e2e: 番組表ページが描画されサービス名が表示される", async () => {
  const browser = await chromium.launch();
  try {
    const page = await newMockedPage(browser);
    await page.goto(`${BASE_URL}/program`);
    await page.getByText("テストＮＨＫ総合").waitFor({
      state: "visible",
      timeout: 5000,
    });
  } finally {
    await browser.close();
  }
});
