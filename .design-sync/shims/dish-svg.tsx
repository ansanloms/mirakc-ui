// Build-time stand-in for `dish.svg?react` (vite-plugin-svgr). esbuild has no
// svgr transform, so the `?react` import is redirected here via tsconfig paths.
// Mirrors svgr's output: a component that spreads props onto the <svg>, so
// DishIcon's width/height/aria-hidden still apply. Markup copied verbatim from
// client/assets/images/dish.svg to keep the icon visually identical.
import * as React from "react";

export default function DishSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <ellipse cx={20} cy={25} rx={12} ry={8} transform="rotate(-32 20 25)" />
      <circle cx={20} cy={25} r={2} fill="currentColor" stroke="none" />
      <path d="M20 25l9-9" />
      <path d="M14 32l-4 8" />
      <path d="M7 40h15" />
      <path d="M31 12a10 10 0 0 1 9 9" opacity={0.5} />
      <path d="M31 5.5a16.5 16.5 0 0 1 13 13" opacity={0.26} />
    </svg>
  );
}
