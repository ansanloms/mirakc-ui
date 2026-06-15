import type { components } from "./api/schema.d.ts";
import type { LiveComment } from "./live-comment.ts";
import { buildChannelGroups, type ChannelGroup } from "./service.ts";
import { nowEpochMs, startOfHourEpochMs } from "./datetime.ts";

type Service = components["schemas"]["MirakurunService"];
type Channel = components["schemas"]["MirakurunChannel"];
type Program = components["schemas"]["MirakurunProgram"];
type Schedule = components["schemas"]["WebRecordingSchedule"];

/**
 * Storybook 用のサンプルデータ。実 API には繋がない純粋なフィクスチャ。
 * 「現在」を基準に放送中/予約済の見た目を確認できるよう nowEpochMs() 起点で組む。
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

/**
 * sampleServices をチャンネル単位に束ねた `/channels` 相当のフィクスチャ。
 * `channel` がキーワード録画ルールの保存値 (MirakurunChannel.channel)。
 */
export const sampleChannels: Channel[] = [
  {
    channel: "27",
    name: "NHK総合",
    type: "GR",
    services: [
      { id: 3273601024, name: "NHK総合", networkId: 32736, serviceId: 1024 },
    ],
  },
  {
    channel: "26",
    name: "Eテレ",
    type: "GR",
    services: [
      { id: 3273701032, name: "Eテレ", networkId: 32737, serviceId: 1032 },
    ],
  },
  {
    channel: "25",
    name: "日テレ",
    type: "GR",
    services: [
      { id: 3274001040, name: "日テレ", networkId: 32740, serviceId: 1040 },
    ],
  },
  {
    channel: "24",
    name: "テレビ朝日",
    type: "GR",
    services: [
      { id: 3274101048, name: "テレビ朝日", networkId: 32741, serviceId: 1048 },
    ],
  },
  {
    channel: "BS15_0",
    name: "BS NHK",
    type: "BS",
    services: [
      { id: 4100101000, name: "BS NHK", networkId: 4, serviceId: 101 },
    ],
  },
];

/** sampleChannels を ChannelGroup に解決したもの (コンポーネントが消費する形)。 */
export const sampleChannelGroups: ChannelGroup[] = buildChannelGroups(
  sampleChannels,
  sampleServices,
);

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
export function buildSamplePrograms(base = nowEpochMs()): Program[] {
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

/** 実況コメントのサンプル。index 3 (「あなた」) のみ自分の投稿 (me=true)。 */
export const sampleLiveComments: LiveComment[] = [
  {
    id: "1",
    name: "視聴者A",
    colorHue: 210,
    text: "始まった",
    time: "21:00",
    me: false,
    source: "nicolive",
  },
  {
    id: "2",
    name: "視聴者B",
    colorHue: 30,
    text: "今日のゲスト豪華だな",
    time: "21:01",
    me: false,
    source: "nicolive",
  },
  {
    id: "3",
    name: "視聴者C",
    colorHue: 150,
    text: "ここ好き",
    time: "21:02",
    me: false,
    source: "nx-jikkyo",
  },
  {
    id: "4",
    name: "あなた",
    colorHue: 210,
    text: "わかる",
    time: "21:02",
    me: true,
    source: "nicolive",
  },
  {
    id: "5",
    name: "視聴者D",
    colorHue: 300,
    text: "次の展開気になる",
    time: "21:03",
    me: false,
    source: "nx-jikkyo",
  },
];

/* -------------------------------------------------------------------------- *
 * README スクリーンショット用のデモデータ。
 *
 * 上の `sample*` は実在の放送局名 (NHK 等) を含み、各コンポーネントのユニット
 * テストがその文字列を直接アサートしている。スクショに実 TV 情報を出さないため、
 * 局名・番組名をすべて **架空** に差し替えた別データセットをここに用意する。
 * テストは `sample*` を使い続け、スクショ用 story だけが `demo*` を参照する。
 *
 * リアルさ (ジャンルの散らばり・ARIB 記号バッジ・放送中ライン) は保ちつつ、
 * 固有名詞は実在しないものだけで構成する。
 * -------------------------------------------------------------------------- */

/**
 * デモの固定基準時刻 (epoch ms)。スクショ用データはこの一点に揃える。
 *
 * 実時刻 (nowEpochMs) を基準にすると、Storybook を開いた時刻で番組とグリッド原点が
 * 凍結される一方、現在時刻ラインだけがライブで進み、両者がズレて見える
 * (「ラベルは 10:11 なのに 8 時の欄に番組がある」状態)。固定値にして
 * 「番組・グリッド原点・現在時刻ライン」を必ず同一時刻に揃える。
 *
 * ローカルタイムゾーンの 2024-06-15(土) 20:40 とする (実機の TZ に依らず同じ壁時計に
 * なるよう、固定の壁時計をローカル TZ で瞬間へ変換する)。
 */
export const DEMO_BASE_MS = Temporal.PlainDateTime
  .from("2024-06-15T20:40:00")
  .toZonedDateTime(Temporal.Now.timeZoneId())
  .epochMilliseconds;

/** 架空の放送局。GR 6 局 + BS 2 局。実局名は使わない。 */
export const demoServices: Service[] = [
  {
    id: 3000101024,
    name: "そらテレビ",
    channel: { type: "GR", channel: "13" },
    type: 1,
    networkId: 30001,
    serviceId: 1024,
    remoteControlKeyId: 1,
    hasLogoData: false,
  },
  {
    id: 3000201032,
    name: "みどり放送",
    channel: { type: "GR", channel: "14" },
    type: 1,
    networkId: 30002,
    serviceId: 1032,
    remoteControlKeyId: 2,
    hasLogoData: false,
  },
  {
    id: 3000401040,
    name: "うみテレビ",
    channel: { type: "GR", channel: "15" },
    type: 1,
    networkId: 30004,
    serviceId: 1040,
    remoteControlKeyId: 4,
    hasLogoData: false,
  },
  {
    id: 3000501048,
    name: "かぜチャンネル",
    channel: { type: "GR", channel: "16" },
    type: 1,
    networkId: 30005,
    serviceId: 1048,
    remoteControlKeyId: 5,
    hasLogoData: false,
  },
  {
    id: 3000601056,
    name: "ほしテレビ",
    channel: { type: "GR", channel: "17" },
    type: 1,
    networkId: 30006,
    serviceId: 1056,
    remoteControlKeyId: 6,
    hasLogoData: false,
  },
  {
    id: 3000801064,
    name: "つきテレビ",
    channel: { type: "GR", channel: "18" },
    type: 1,
    networkId: 30008,
    serviceId: 1064,
    remoteControlKeyId: 8,
    hasLogoData: false,
  },
  {
    id: 40100201,
    name: "BS そら",
    channel: { type: "BS", channel: "BS01_0" },
    type: 1,
    networkId: 401,
    serviceId: 201,
    remoteControlKeyId: 201,
    hasLogoData: false,
  },
  {
    id: 40200211,
    name: "BS うみ",
    channel: { type: "BS", channel: "BS03_0" },
    type: 1,
    networkId: 402,
    serviceId: 211,
    remoteControlKeyId: 211,
    hasLogoData: false,
  },
];

type DemoSlot = {
  /** 番組名。ARIB 記号 ([新][字][映][生] 等) を含めるとバッジが出る。 */
  name: string;
  /** ARIB lv1 ジャンルコード。グリッドのセル色に対応する。 */
  genreLv1: number;
  /** 放送尺 (分)。番組ごとに変えてグリッドの行高を不揃いにする。 */
  durationMin: number;
  /** 任意。番組情報タブ用のあらすじ。未指定は makeProgram の既定文。 */
  description?: string;
  /** 任意。EIT 拡張の key-value (出演者など)。 */
  extended?: Program["extended"];
};

/**
 * 局ごとの編成。`startOffsetMin` で局ごとに開始をずらし、可変尺の番組を背中合わせに
 * 連ねる (実 EPG のように開始時刻も尺も不揃いにする)。固有名詞はすべて架空。
 * 夕方〜深夜帯を埋め、ch0 の「よあけの街」が DEMO_BASE_MS (20:40) に放送中になる。
 */
const demoLineup: {
  service: Service;
  startOffsetMin: number;
  slots: DemoSlot[];
}[] = [
  {
    service: demoServices[0], // そらテレビ
    startOffsetMin: 0,
    slots: [
      { name: "夕方ワイドニュース", genreLv1: 0, durationMin: 90 },
      { name: "クイズ・ファミリー対抗戦", genreLv1: 5, durationMin: 40 },
      {
        name: "[新]連続ドラマ「よあけの街」[字]",
        genreLv1: 3,
        durationMin: 60,
        description:
          "港町の小さな喫茶店を舞台に、過去を抱えた店主と訪れる客たちの一年を描く新シリーズ。第一話は開店前夜の出来事から始まる。",
        extended: {
          出演者: "架空 太郎 / 架空 花子 / 物語 桜",
          原作: "デモ・ノベルズ「よあけの街」",
          音楽: "サンプル・サウンド",
        } as unknown as Program["extended"],
      },
      { name: "報道スペシャル[字]", genreLv1: 0, durationMin: 80 },
      {
        name: "シネマ劇場「最後の手紙」[字][映]",
        genreLv1: 6,
        durationMin: 110,
      },
      { name: "深夜アニメ「まほうの森」[字]", genreLv1: 7, durationMin: 30 },
      { name: "ミッドナイト・ミュージック[生]", genreLv1: 4, durationMin: 60 },
      { name: "ショッピング情報", genreLv1: 2, durationMin: 70 },
    ],
  },
  {
    service: demoServices[1], // みどり放送
    startOffsetMin: -30,
    slots: [
      { name: "やさしい園芸入門[字]", genreLv1: 10, durationMin: 60 },
      { name: "夕方の科学教室", genreLv1: 10, durationMin: 30 },
      { name: "ドキュメント・ある町の一年[字]", genreLv1: 8, durationMin: 75 },
      { name: "趣味の写真術[再]", genreLv1: 10, durationMin: 45 },
      { name: "クラシック名曲アワー[生]", genreLv1: 4, durationMin: 90 },
      { name: "世界遺産紀行[字]", genreLv1: 8, durationMin: 60 },
      { name: "語学講座・はじめての英会話", genreLv1: 10, durationMin: 30 },
      { name: "深夜の朗読", genreLv1: 9, durationMin: 60 },
    ],
  },
  {
    service: demoServices[2], // うみテレビ
    startOffsetMin: -10,
    slots: [
      { name: "夕方バラエティ わいわい広場[字]", genreLv1: 5, durationMin: 70 },
      { name: "クイズ！なんでもズバリ[字]", genreLv1: 5, durationMin: 54 },
      { name: "スポーツライブ 球技特集[生]", genreLv1: 1, durationMin: 126 },
      { name: "トーク&ライブ[生]", genreLv1: 5, durationMin: 60 },
      { name: "深夜スポーツニュース", genreLv1: 1, durationMin: 45 },
      { name: "シネマナイト「遠い灯」[字][映]", genreLv1: 6, durationMin: 105 },
      { name: "通販ナビ", genreLv1: 2, durationMin: 60 },
    ],
  },
  {
    service: demoServices[3], // かぜチャンネル
    startOffsetMin: 10,
    slots: [
      { name: "イブニング報道[字]", genreLv1: 0, durationMin: 80 },
      { name: "歌のステージ[生]", genreLv1: 4, durationMin: 54 },
      { name: "音楽ライブ・アワー[生]", genreLv1: 4, durationMin: 66 },
      {
        name: "金曜ロードシアター「霧の館」[字][映]",
        genreLv1: 6,
        durationMin: 120,
      },
      { name: "ニュースな夜[字]", genreLv1: 0, durationMin: 45 },
      { name: "ミュージック・ビデオ・ナイト", genreLv1: 4, durationMin: 75 },
    ],
  },
  {
    service: demoServices[4], // ほしテレビ
    startOffsetMin: -20,
    slots: [
      {
        name: "夕方アニメ「ひかりの冒険者」[新][字]",
        genreLv1: 7,
        durationMin: 50,
      },
      { name: "アニメ「ほしのこどもたち」[字]", genreLv1: 7, durationMin: 30 },
      { name: "バラエティ・ナイトジャム[字]", genreLv1: 5, durationMin: 84 },
      {
        name: "サスペンス劇場「沈黙の証人」[字]",
        genreLv1: 3,
        durationMin: 96,
      },
      { name: "アニメ劇場・特別編[字]", genreLv1: 7, durationMin: 90 },
      { name: "深夜のトークルーム", genreLv1: 5, durationMin: 60 },
      { name: "ミッドナイトアニメ[字]", genreLv1: 7, durationMin: 30 },
    ],
  },
  {
    service: demoServices[5], // つきテレビ
    startOffsetMin: -40,
    slots: [
      { name: "夕方の絶景紀行[字]", genreLv1: 8, durationMin: 70 },
      { name: "世界の食卓[字]", genreLv1: 8, durationMin: 54 },
      { name: "ジャズ・ナイト・セッション[生]", genreLv1: 4, durationMin: 66 },
      {
        name: "ドキュメンタリー「海をわたる」[字]",
        genreLv1: 8,
        durationMin: 90,
      },
      { name: "ナイト・トーク・ラウンジ", genreLv1: 5, durationMin: 60 },
      { name: "星空アワー", genreLv1: 8, durationMin: 90 },
      { name: "ミニ番組・星空案内", genreLv1: 2, durationMin: 15 },
    ],
  },
  {
    service: demoServices[6], // BS そら
    startOffsetMin: 0,
    slots: [
      { name: "BS 自然紀行「大河をゆく」[字]", genreLv1: 8, durationMin: 90 },
      { name: "BS 名曲アルバム", genreLv1: 4, durationMin: 30 },
      { name: "BS 特集ドラマ「海辺の約束」[字]", genreLv1: 3, durationMin: 90 },
      { name: "BS シネマ「青の彼方」[字][映]", genreLv1: 6, durationMin: 120 },
      { name: "BS ワールドニュース[字]", genreLv1: 0, durationMin: 60 },
      { name: "BS 音楽の夜[生]", genreLv1: 4, durationMin: 90 },
    ],
  },
  {
    service: demoServices[7], // BS うみ
    startOffsetMin: -15,
    slots: [
      { name: "BS 旅と暮らし[字]", genreLv1: 2, durationMin: 75 },
      { name: "BS バラエティ ナイト[字]", genreLv1: 5, durationMin: 54 },
      { name: "BS スポーツアワー[生]", genreLv1: 1, durationMin: 126 },
      { name: "BS ドキュメント「山の四季」[字]", genreLv1: 8, durationMin: 60 },
      {
        name: "BS シアター「白夜の街」[字][映]",
        genreLv1: 6,
        durationMin: 115,
      },
      { name: "BS ショッピング", genreLv1: 2, durationMin: 65 },
    ],
  },
];

/**
 * デモ番組表を組む。グリッド原点 (base の正時) の 2 時間前を全体の起点にし、局ごとに
 * `startOffsetMin` で開始をずらして可変尺の番組を背中合わせに連ねる。
 */
export function buildDemoPrograms(base = DEMO_BASE_MS): Program[] {
  const origin = startOfHourEpochMs(base) - 2 * HOUR;
  const programs: Program[] = [];
  for (const { service, startOffsetMin, slots } of demoLineup) {
    let cursor = origin + startOffsetMin * MIN;
    slots.forEach((slot, i) => {
      programs.push(
        makeProgram({
          id: service.id * 100 + i,
          name: slot.name,
          networkId: service.networkId,
          serviceId: service.serviceId,
          startAt: cursor,
          duration: slot.durationMin * MIN,
          genreLv1: slot.genreLv1,
          ...(slot.description ? { description: slot.description } : {}),
          ...(slot.extended ? { extended: slot.extended } : {}),
        }),
      );
      cursor += slot.durationMin * MIN;
    });
  }
  return programs;
}

export const demoPrograms: Program[] = buildDemoPrograms(DEMO_BASE_MS);

const demoProgramByName = (name: string): Program => {
  const program = demoPrograms.find((p) => p.name === name);
  if (program === undefined) {
    throw new Error(`demo program not found: ${name}`);
  }
  return program;
};

/** DEMO_BASE_MS に放送中の主役番組 (ch0 のドラマ)。Watch / 番組詳細デモで使う。 */
export const demoFeaturedService: Service = demoServices[0];
export const demoFeaturedProgram: Program = demoProgramByName(
  "[新]連続ドラマ「よあけの街」[字]",
);

/**
 * 予約済 / 録画済のデモ。バッジ確認用に 1 件ずつ。時刻が重ならないよう、予約は未来の
 * 映画 (22:30〜)、録画済は終了済みの番組 (〜20:30) を選ぶ。
 */
export const demoSchedules: Schedule[] = [
  {
    program: demoProgramByName("シネマ劇場「最後の手紙」[字][映]"),
    state: "scheduled",
    options: { contentPath: "demo_scheduled.m2ts" },
    tags: [],
  },
  {
    program: demoProgramByName("ジャズ・ナイト・セッション[生]"),
    state: "finished",
    options: { contentPath: "demo_finished.m2ts" },
    tags: [],
  },
];
