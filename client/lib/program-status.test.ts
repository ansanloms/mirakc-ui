import { describe, expect, it } from "vitest";
import {
  extractProgramMarks,
  PROGRAM_MARKS,
} from "./program-status.ts";

/** marks を読みやすく char 列で比較するヘルパ。 */
function chars(name: string): string[] {
  return extractProgramMarks(name).marks.map((mark) => mark.char);
}

describe("extractProgramMarks", () => {
  it("末尾の単独記号を抽出し name から除去する", () => {
    const { name, marks } = extractProgramMarks("ミッドナイトタクシーＰＲ[字]");
    expect(name).toBe("ミッドナイトタクシーＰＲ");
    expect(marks.map((m) => m.char)).toEqual(["字"]);
  });

  it("末尾の複数記号を抽出し、正準順 (MARK_ORDER) で返す", () => {
    const src =
      "ＦＩＦＡワールドカップ　▽開会式▽１次リーグ・Ａ組　メキシコ対南アフリカ[SS][字][デ]";
    const { name } = extractProgramMarks(src);
    expect(name).toBe(
      "ＦＩＦＡワールドカップ　▽開会式▽１次リーグ・Ａ組　メキシコ対南アフリカ",
    );
    // 出現順は [SS][字][デ] だが、正準順では 字 → デ → SS。
    expect(chars(src)).toEqual(["字", "デ", "SS"]);
  });

  it("先頭の記号も抽出する ([終] が先頭、[解][字] が末尾)", () => {
    const src = "[終]リボーン 〜最後のヒーロー〜　＃９[解][字]";
    const { name } = extractProgramMarks(src);
    expect(name).toBe("リボーン 〜最後のヒーロー〜　＃９");
    // 正準順: 終 → 字 → 解。
    expect(chars(src)).toEqual(["終", "字", "解"]);
  });

  it("中間の記号も抽出する (全角スペース区切りは保持)", () => {
    const src = "ｎｅｗｓ２３[字]　【宇都宮クマ捕獲】別のクマがいる可能性…あすも市立小中学校休校へ";
    const { name } = extractProgramMarks(src);
    expect(name).toBe(
      "ｎｅｗｓ２３　【宇都宮クマ捕獲】別のクマがいる可能性…あすも市立小中学校休校へ",
    );
    expect(chars(src)).toEqual(["字"]);
  });

  it("【】や「」は記号として扱わず残す", () => {
    const src =
      "【特選！時代劇】陽炎の辻〜居眠り磐音　江戸双紙〜（８）「対決の晩夏」[解][字]";
    const { name } = extractProgramMarks(src);
    expect(name).toBe(
      "【特選！時代劇】陽炎の辻〜居眠り磐音　江戸双紙〜（８）「対決の晩夏」",
    );
    expect(chars(src)).toEqual(["字", "解"]);
  });

  it("未知の角括弧トークンは name に残す", () => {
    const { name, marks } = extractProgramMarks("第[8]話 タイトル");
    expect(name).toBe("第[8]話 タイトル");
    expect(marks).toEqual([]);
  });

  it("同じ記号が複数あっても重複排除する", () => {
    expect(chars("番組[字][字]")).toEqual(["字"]);
  });

  it("記号間の余分な半角スペースは畳む", () => {
    const { name } = extractProgramMarks("映画 [二] [吹]");
    expect(name).toBe("映画");
    expect(chars("映画 [二] [吹]")).toEqual(["二", "吹"]);
  });

  it("記号が無ければ name はそのまま、marks は空", () => {
    const { name, marks } = extractProgramMarks("ニュース７");
    expect(name).toBe("ニュース７");
    expect(marks).toEqual([]);
  });

  it("undefined / null / 空文字は { name: \"\", marks: [] }", () => {
    expect(extractProgramMarks(undefined)).toEqual({ name: "", marks: [] });
    expect(extractProgramMarks(null)).toEqual({ name: "", marks: [] });
    expect(extractProgramMarks("")).toEqual({ name: "", marks: [] });
  });
});

describe("PROGRAM_MARKS テーブル", () => {
  it("tone は意味論に沿って付与される", () => {
    const byChar = new Map(PROGRAM_MARKS.map((m) => [m.char, m]));
    expect(byChar.get("生")?.tone).toBe("live");
    expect(byChar.get("新")?.tone).toBe("new");
    expect(byChar.get("初")?.tone).toBe("new");
    expect(byChar.get("終")?.tone).toBe("warn");
    expect(byChar.get("映")?.tone).toBe("movie");
    expect(byChar.get("料")?.tone).toBe("pay");
    expect(byChar.get("PPV")?.tone).toBe("pay");
    // 中立記号は tone を持たない。
    expect(byChar.get("字")?.tone).toBeUndefined();
  });

  it("key / char は一意", () => {
    expect(new Set(PROGRAM_MARKS.map((m) => m.key)).size)
      .toBe(PROGRAM_MARKS.length);
    expect(new Set(PROGRAM_MARKS.map((m) => m.char)).size)
      .toBe(PROGRAM_MARKS.length);
  });
});
