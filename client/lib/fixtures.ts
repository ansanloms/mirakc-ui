import type { components } from "./api/schema.d.ts";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];
type Schedule = components["schemas"]["WebRecordingSchedule"];

/**
 * Storybook 用のサンプルデータ。実 API には繋がない純粋なフィクスチャ。
 * 「現在」を基準に放送中/予約済の見た目を確認できるよう Date.now() 起点で組む。
 */

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const sampleServices: Service[] = [
  {
    id: 3273601024,
    name: "NHK総合",
    channel: { type: "GR", channel: "27" },
    type: 1,
    networkId: 32736,
    serviceId: 1024,
    remoteControlKeyId: 1,
    hasLogoData: false,
  },
  {
    id: 3273701032,
    name: "Eテレ",
    channel: { type: "GR", channel: "26" },
    type: 1,
    networkId: 32737,
    serviceId: 1032,
    remoteControlKeyId: 2,
    hasLogoData: false,
  },
  {
    id: 3274001040,
    name: "日テレ",
    channel: { type: "GR", channel: "25" },
    type: 1,
    networkId: 32740,
    serviceId: 1040,
    remoteControlKeyId: 4,
    hasLogoData: false,
  },
  {
    id: 3274101048,
    name: "テレビ朝日",
    channel: { type: "GR", channel: "24" },
    type: 1,
    networkId: 32741,
    serviceId: 1048,
    remoteControlKeyId: 5,
    hasLogoData: false,
  },
  {
    id: 4100101000,
    name: "BS NHK",
    channel: { type: "BS", channel: "BS15_0" },
    type: 1,
    networkId: 4,
    serviceId: 101,
    remoteControlKeyId: 101,
    hasLogoData: false,
  },
];

function makeProgram(
  partial: Partial<Program> & {
    id: number;
    name: string;
    networkId: number;
    serviceId: number;
    startAt: number;
    duration: number;
    genreLv1: number;
  },
): Program {
  const { genreLv1, ...rest } = partial;
  return {
    eventId: partial.id % 100000,
    isFree: true,
    description:
      "番組のあらすじがここに入る。みどころや出演者の見せ場、放送回の内容を簡潔に紹介する想定のダミーテキスト。",
    genres: [{ lv1: genreLv1, lv2: 0, un1: 0, un2: 0 }],
    // schema は extended を空オブジェクト型に潰しているが、実 API は EIT 拡張の
    // key-value 文字列マップを返す。fixtures では unknown 経由でキャストする。
    extended: {
      出演者: "山田太郎 / 佐藤花子 / 鈴木一郎",
      音楽: "テーマ曲 ○○",
    } as unknown as Program["extended"],
    audios: [
      {
        componentType: 1,
        isMain: true,
        langs: ["jpn"],
        samplingRate: 48000,
      },
    ],
    ...rest,
  };
}

/** 「現在」起点の番組表サンプル。各サービスに放送中＋前後の番組を並べる。 */
export function buildSamplePrograms(base = Date.now()): Program[] {
  const slotStart = base - 30 * MIN;
  const programs: Program[] = [];

  const titles: Record<number, string[]> = {
    3273601024: ["ニュース７", "クローズアップ現代", "大河ドラマ アンコール"],
    3273701032: ["きょうの料理", "趣味の園芸", "ドキュメント72時間"],
    3274001040: ["お笑いバラエティ", "情報ライブ", "サッカー中継"],
    3274101048: ["報道ステーション", "ミュージックステーション", "映画劇場"],
    4100101000: ["BSニュース", "BS音楽祭", "BSドキュメンタリー"],
  };
  const genreSeq: Record<number, number[]> = {
    3273601024: [0, 2, 3],
    3273701032: [10, 10, 8],
    3274001040: [5, 2, 1],
    3274101048: [0, 4, 6],
    4100101000: [0, 4, 8],
  };

  for (const service of sampleServices) {
    const names = titles[service.id] ?? ["番組A", "番組B", "番組C"];
    const genres = genreSeq[service.id] ?? [15, 15, 15];
    for (let i = 0; i < 3; i++) {
      programs.push(
        makeProgram({
          id: service.id * 10 + i,
          name: names[i],
          networkId: service.networkId,
          serviceId: service.serviceId,
          startAt: slotStart + i * HOUR,
          duration: HOUR,
          genreLv1: genres[i],
        }),
      );
    }
  }
  return programs;
}

export const samplePrograms: Program[] = buildSamplePrograms();

/** 放送中 (2 番目のスロット) の番組サンプル。 */
export const sampleProgram: Program = samplePrograms[1];

/** 予約済 (scheduled) と 録画済 (finished) のサンプル。 */
export const sampleSchedules: Schedule[] = [
  {
    program: samplePrograms[2],
    state: "scheduled",
    options: { contentPath: "sample_scheduled.m2ts" },
    tags: [],
  },
  {
    program: samplePrograms[5],
    state: "finished",
    options: { contentPath: "sample_finished.m2ts" },
    tags: [],
  },
];
