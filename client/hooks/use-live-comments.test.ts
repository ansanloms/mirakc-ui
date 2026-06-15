import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { toLiveComment, useLiveComments } from "./use-live-comments.ts";
import { formatHm } from "../lib/datetime.ts";
import type {
  CommentSourceId,
  SourceComment,
} from "../../server/lib/comments/types.ts";

afterEach(() => {
  cleanup();
});

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  listeners = new Map<string, Set<(event: MessageEvent) => void>>();
  onerror: ((event: Event) => void) | null = null;
  closed = false;

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new MessageEvent(type, { data }));
    }
  }
}

function setup(
  serviceId: number | undefined,
  opts: { limit?: number } = {},
) {
  FakeEventSource.instances = [];
  const createEventSource = (url: string) =>
    new FakeEventSource(url) as unknown as EventSource;
  const view = renderHook(
    (props: { serviceId: number | undefined }) =>
      useLiveComments(props.serviceId, { createEventSource, ...opts }),
    { initialProps: { serviceId } },
  );
  return { view, instances: FakeEventSource.instances };
}

function commentOf(
  id: string,
  source: CommentSourceId,
  text: string,
): SourceComment {
  return { id, source, at: 1718240401_000, text };
}

describe("useLiveComments", () => {
  it("serviceId が無ければ接続しない", () => {
    const { view, instances } = setup(undefined);
    expect(instances.length).toBe(0);
    expect(view.result.current.connected).toBe(false);
  });

  it("comment を取得元付きの LiveComment に変換して積む", () => {
    const { view, instances } = setup(10);
    act(() => {
      instances[0].emit("sources", JSON.stringify(["nicolive"]));
      instances[0].emit(
        "comment",
        JSON.stringify(commentOf("a", "nicolive", "やあ")),
      );
    });
    expect(view.result.current.connected).toBe(true);
    expect(view.result.current.sources).toEqual(["nicolive"]);
    expect(view.result.current.comments).toEqual([
      {
        id: "nicolive:a",
        name: "",
        colorHue: expect.any(Number),
        text: "やあ",
        time: formatHm(1718240401_000),
        me: false,
        source: "nicolive",
      },
    ]);
  });

  it("複数取得元のコメントをフィルタせず全て積む", () => {
    const { view, instances } = setup(10);
    act(() => {
      instances[0].emit("sources", JSON.stringify(["nicolive", "nx-jikkyo"]));
      instances[0].emit(
        "comment",
        JSON.stringify(commentOf("a", "nicolive", "ニコ生")),
      );
      instances[0].emit(
        "comment",
        JSON.stringify(commentOf("b", "nx-jikkyo", "NX")),
      );
    });
    expect(view.result.current.sources).toEqual(["nicolive", "nx-jikkyo"]);
    expect(view.result.current.comments.map((c) => c.text)).toEqual([
      "ニコ生",
      "NX",
    ]);
  });

  it("sources が空なら実況非対応として切断する", () => {
    const { view, instances } = setup(10);
    act(() => {
      instances[0].emit("sources", JSON.stringify([]));
    });
    expect(view.result.current.connected).toBe(false);
    expect(instances[0].closed).toBe(true);
  });

  it("sources 再送 (再接続) で接続を保ちコメントを捨てない", () => {
    const { view, instances } = setup(10);
    act(() => {
      instances[0].emit("sources", JSON.stringify(["nicolive"]));
      instances[0].emit(
        "comment",
        JSON.stringify(commentOf("a", "nicolive", "やあ")),
      );
    });
    act(() => {
      instances[0].emit("sources", JSON.stringify(["nicolive", "nx-jikkyo"]));
    });
    expect(view.result.current.connected).toBe(true);
    expect(view.result.current.sources).toEqual(["nicolive", "nx-jikkyo"]);
    expect(view.result.current.comments.map((c) => c.text)).toEqual(["やあ"]);
  });

  it("serviceId が変わったら接続し直してコメントを捨てる", () => {
    const { view, instances } = setup(10);
    act(() => {
      instances[0].emit("sources", JSON.stringify(["nicolive"]));
      instances[0].emit(
        "comment",
        JSON.stringify(commentOf("a", "nicolive", "old")),
      );
    });
    expect(view.result.current.comments.length).toBe(1);

    view.rerender({ serviceId: 20 });
    expect(instances[0].closed).toBe(true);
    expect(instances.length).toBe(2);
    expect(view.result.current.comments).toEqual([]);
  });
});

describe("toLiveComment", () => {
  it("source を保持し、colorHue は author から安定導出する", () => {
    const a1 = toLiveComment({
      ...commentOf("x", "nicolive", "t"),
      author: "太郎",
    });
    const a2 = toLiveComment({
      ...commentOf("y", "nicolive", "t"),
      author: "太郎",
    });
    expect(a1.source).toBe("nicolive");
    expect(a1.colorHue).toBe(a2.colorHue);
  });
});
