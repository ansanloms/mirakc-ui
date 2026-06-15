import { describe, expect, it } from "vitest";
import {
  COMMENT_SOURCE_COLOR,
  COMMENT_SOURCE_ORDER,
  commentSourceLabel,
  commentSourceTag,
  sortCommentSources,
} from "./comment-source.ts";
import type { CommentSourceId } from "../../server/lib/comments/types.ts";
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
    // 表示順 (COMMENT_SOURCE_ORDER) に無い取得元は末尾へ回る防御的挙動。
    const unknown = "unknown" as CommentSourceId;
    expect(sortCommentSources([unknown, "nicolive"])).toEqual([
      "nicolive",
      unknown,
    ]);
  });
});
