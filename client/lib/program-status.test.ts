import { describe, expect, it } from "vitest";
import {
  extractProgramMarks,
  MARK_DEFS,
  markLabel,
  markShort,
} from "./program-status.ts";

/** marks を読みやすく key 列で比較するヘルパ。 */
function keys(name: string): string[] {
  return extractProgramMarks(name).marks.map((mark) => mark.key);
}

describe("extractProgramMarks", () => {
  it("末尾の単独記号を抽出し name から除去する", () => {
    const { name, marks } = extractProgramMarks("ミッドナイトタクシーＰＲ[字]");
    expect(name).toBe("ミッドナイトタクシーＰＲ");
    expect(marks.map((m) => m.key)).toEqual(["ji"]);
  });

  it("末尾の複数記号を抽出し、正準順 (MARK_DEFS の並び) で返す", () => {
    const src =
      "ＦＩＦＡワールドカップ　▽開会式▽１次リーグ・Ａ組　メキシコ対南アフリカ[SS][字][デ]";
    const { name } = extractProgramMarks(src);
    expect(name).toBe(
      "ＦＩＦＡワールドカップ　▽開会式▽１次リーグ・Ａ組　メキシコ対南アフリカ",
    );
    // 出現順は SS, 字, デ だが、正準順では ji → de → ss。
    expect(keys(src)).toEqual(["ji", "de", "ss"]);
  });

  it("先頭の記号も抽出する ([終] が先頭、[解][字] が末尾)", () => {
    const src = "[終]リボーン 〜最後のヒーロー〜　＃９[解][字]";
    const { name } = extractProgramMarks(src);
    expect(name).toBe("リボーン 〜最後のヒーロー〜　＃９");
    // 正準順: fin → ji → kai。
    expect(keys(src)).toEqual(["fin", "ji", "kai"]);
  });

  it("中間の記号も抽出する (全角スペース区切りは保持)", () => {
    const src =
      "ｎｅｗｓ２３[字]　【宇都宮クマ捕獲】別のクマがいる可能性…あすも市立小中学校休校へ";
    const { name } = extractProgramMarks(src);
    expect(name).toBe(
      "ｎｅｗｓ２３　【宇都宮クマ捕獲】別のクマがいる可能性…あすも市立小中学校休校へ",
    );
    expect(keys(src)).toEqual(["ji"]);
  });

  it("【】や「」は記号として扱わず残す", () => {
    const src =
      "【特選！時代劇】陽炎の辻〜居眠り磐音　江戸双紙〜（８）「対決の晩夏」[解][字]";
    const { name } = extractProgramMarks(src);
    expect(name).toBe(
      "【特選！時代劇】陽炎の辻〜居眠り磐音　江戸双紙〜（８）「対決の晩夏」",
    );
    expect(keys(src)).toEqual(["ji", "kai"]);
  });

  it("未知の角括弧トークンは name に残す", () => {
    const { name, marks } = extractProgramMarks("第[8]話 タイトル");
    expect(name).toBe("第[8]話 タイトル");
    expect(marks).toEqual([]);
  });

  it("同じ記号が複数あっても重複排除する", () => {
    expect(keys("番組[字][字]")).toEqual(["ji"]);
  });

  it("記号間の余分な半角スペースは畳む", () => {
    const { name } = extractProgramMarks("映画 [二] [吹]");
    expect(name).toBe("映画");
    expect(keys("映画 [二] [吹]")).toEqual(["ni", "fuki"]);
  });

  it("記号が無ければ name はそのまま、marks は空", () => {
    const { name, marks } = extractProgramMarks("ニュース７");
    expect(name).toBe("ニュース７");
    expect(marks).toEqual([]);
  });

  it('undefined / null / 空文字は { name: "", marks: [] }', () => {
    expect(extractProgramMarks(undefined)).toEqual({ name: "", marks: [] });
    expect(extractProgramMarks(null)).toEqual({ name: "", marks: [] });
    expect(extractProgramMarks("")).toEqual({ name: "", marks: [] });
  });
});

describe("MARK_DEFS テーブル", () => {
  it("tone は意味論に沿って付与される", () => {
    const byKey = new Map(MARK_DEFS.map((d) => [d.key, d]));
    expect(byKey.get("nama")?.tone).toBe("live");
    expect(byKey.get("shin")?.tone).toBe("new");
    expect(byKey.get("hatsu")?.tone).toBe("new");
    expect(byKey.get("fin")?.tone).toBe("warn");
    expect(byKey.get("ei")?.tone).toBe("movie");
    expect(byKey.get("ryo")?.tone).toBe("pay");
    expect(byKey.get("ppv")?.tone).toBe("pay");
    // 中立記号は tone を持たない。
    expect(byKey.get("ji")?.tone).toBeUndefined();
  });

  it("key / symbol は一意", () => {
    expect(new Set(MARK_DEFS.map((d) => d.key)).size).toBe(MARK_DEFS.length);
    expect(new Set(MARK_DEFS.map((d) => d.symbol)).size).toBe(MARK_DEFS.length);
  });
});

describe("文言 (locales)", () => {
  it("markShort はグリッド用の短縮表記を返す", () => {
    expect(markShort("ji")).toBe("字");
    expect(markShort("ss")).toBe("SS");
  });

  it("markLabel は意味ラベルを返す", () => {
    expect(markLabel("ji")).toBe("字幕放送");
    expect(markLabel("shin")).toBe("新番組");
    expect(markLabel("ppv")).toBe("ペイパービュー");
  });
});
