import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { toLiveComment, useLiveComments } from "./use-live-comments.ts";
import { formatHm } from "../lib/datetime.ts";
import type { SourceComment } from "../../server/lib/comments/types.ts";

afterEach(cleanup);

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

function setup(serviceId: number | undefined, limit?: number) {
  FakeEventSource.instances = [];
  const createEventSource = (url: string) =>
    new FakeEventSource(url) as unknown as EventSource;
  const view = renderHook(
    (props: { serviceId: number | undefined }) =>
      useLiveComments(props.serviceId, { createEventSource, limit }),
    { initialProps: { serviceId } },
  );
  return { view, instances: FakeEventSource.instances };
}

function commentOf(id: string, text: string): SourceComment {
  return { id, source: "nicolive", at: 1718240401_000, text };
}

describe("useLiveComments", () => {
  it("serviceId が無ければ接続しない", () => {
    const { view, instances } = setup(undefined);
    expect(instances.length).toBe(0);
    expect(view.result.current.comments).toEqual([]);
    expect(view.result.current.connected).toBe(false);
  });

  it("comment イベントを表示用 LiveComment に変換して積む", () => {
    const { view, instances } = setup(10);
    expect(instances.length).toBe(1);
    expect(instances[0].url).toBe("/api/comments/services/10/stream");

    act(() => {
      instances[0].emit("sources", JSON.stringify(["nicolive"]));
      instances[0].emit("comment", JSON.stringify(commentOf("a", "やあ")));
      instances[0].emit(
        "comment",
        JSON.stringify({ ...commentOf("b", "named"), author: "太郎" }),
      );
    });

    expect(view.result.current.connected).toBe(true);
    expect(view.result.current.comments).toEqual([
      {
        id: "nicolive:a",
        name: "",
        colorHue: expect.any(Number),
        text: "やあ",
        time: formatHm(1718240401_000),
        me: false,
      },
      {
        id: "nicolive:b",
        name: "太郎",
        colorHue: expect.any(Number),
        text: "named",
        time: formatHm(1718240401_000),
        me: false,
      },
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

  it("保持件数は limit で打ち切る (古いものから捨てる)", () => {
    const { view, instances } = setup(10, 2);
    act(() => {
      instances[0].emit("comment", JSON.stringify(commentOf("a", "1")));
      instances[0].emit("comment", JSON.stringify(commentOf("b", "2")));
      instances[0].emit("comment", JSON.stringify(commentOf("c", "3")));
    });
    expect(view.result.current.comments.map((comment) => comment.text))
      .toEqual(["2", "3"]);
  });

  it("serviceId が変わったら接続し直してコメントを捨てる", () => {
    const { view, instances } = setup(10);
    act(() => {
      instances[0].emit("comment", JSON.stringify(commentOf("a", "old")));
    });
    expect(view.result.current.comments.length).toBe(1);

    view.rerender({ serviceId: 20 });
    expect(instances[0].closed).toBe(true);
    expect(instances.length).toBe(2);
    expect(instances[1].url).toBe("/api/comments/services/20/stream");
    expect(view.result.current.comments).toEqual([]);
  });

  it("unmount で切断する", () => {
    const { view, instances } = setup(10);
    view.unmount();
    expect(instances[0].closed).toBe(true);
  });
});

describe("toLiveComment", () => {
  it("colorHue は author から安定的に導出される", () => {
    const a1 = toLiveComment({ ...commentOf("x", "t"), author: "太郎" });
    const a2 = toLiveComment({ ...commentOf("y", "t"), author: "太郎" });
    expect(a1.colorHue).toBe(a2.colorHue);
    expect(a1.colorHue).toBeGreaterThanOrEqual(0);
    expect(a1.colorHue).toBeLessThan(360);
  });
});
