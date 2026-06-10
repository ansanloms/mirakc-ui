import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ChannelBadge from "./ChannelBadge.tsx";
import { sampleServices } from "../../lib/fixtures.ts";
import { serviceNumber } from "../../lib/service.ts";

const service = sampleServices[0]; // NHK総合, remoteControlKeyId: 1

/** size を指定して描画し、ルート要素の className を返す（比較用）。 */
function classNameOf(size?: "xs" | "sm" | "md"): string {
  const { container, unmount } = render(
    <ChannelBadge service={service} size={size} />,
  );
  const className = (container.firstChild as HTMLElement).className;
  unmount();
  return className;
}

describe("ChannelBadge", () => {
  it("service から番号 (remoteControlKeyId 優先) を描画する", () => {
    render(<ChannelBadge service={service} />);
    expect(screen.getByText(String(serviceNumber(service)))).toBeTruthy();
  });

  it("size 違い (xs/sm/md) でクラスが変わる", () => {
    const xs = classNameOf("xs");
    const sm = classNameOf("sm");
    const md = classNameOf("md");
    expect(xs).not.toBe(sm);
    expect(sm).not.toBe(md);
    expect(xs).not.toBe(md);
  });

  it("size 未指定なら md と同じクラスになる (既定値)", () => {
    expect(classNameOf()).toBe(classNameOf("md"));
  });
});
