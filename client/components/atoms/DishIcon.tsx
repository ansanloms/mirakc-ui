type Props = {
  /** サイズ (px)。 */
  size?: number;
};

/**
 * パラボラアンテナ (皿) のアイコン。BS/CS 等の未接続を表す空状態で使う。
 * Material Symbols に近い意匠が無いため独自 SVG。
 */
export default function DishIcon({ size = 40 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="20" cy="25" rx="12" ry="8" transform="rotate(-32 20 25)" />
      <circle cx="20" cy="25" r="2" fill="currentColor" stroke="none" />
      <path d="M20 25l9-9" />
      <path d="M14 32l-4 8" />
      <path d="M7 40h15" />
      <path d="M31 12a10 10 0 0 1 9 9" opacity={0.5} />
      <path d="M31 5.5a16.5 16.5 0 0 1 13 13" opacity={0.26} />
    </svg>
  );
}
