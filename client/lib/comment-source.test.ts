import { describe, expect, it } from "vitest";
import {
  COMMENT_SOURCE_COLOR,
  COMMENT_SOURCE_ORDER,
  commentSourceLabel,
  commentSourceTag,
  sortCommentSources,
} from "./comment-source.ts";
import { t } from "../locales/i18n.ts";

describe("comment-source", () => {
  it("全取得元に色が定義されている", () => {
    for (const id of COMMENT_SOURCE_ORDER) {
      expect(COMMENT_SOURCE_COLOR[id]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("label / tag は locales から引く", () => {
    expect(commentSourceLabel("nicolive")).toBe(
      t("liveComment.source.nicolive.label"),
    );
    expect(commentSourceTag("nx-jikkyo")).toBe(
      t("liveComment.source.nx-jikkyo.tag"),
    );
  });

  it("sortCommentSources は表示順に並べ替える", () => {
    expect(sortCommentSources(["nx-jikkyo", "nicolive"])).toEqual([
      "nicolive",
      "nx-jikkyo",
    ]);
  });

  it("未知の取得元は末尾に回す", () => {
    expect(sortCommentSources(["bsky", "nicolive"])).toEqual([
      "nicolive",
      "bsky",
    ]);
  });
});
