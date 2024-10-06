type Props = { children: string; size?: number | string; spin?: boolean };

export default function Icon({ children, size, spin }: Props) {
  return (
    <span
      class={`material-symbols-outlined ${spin ? "animate-spin" : ""}`}
      style={{
        width: size || "auto",
        fontSize: size || "auto",
        fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48',
      }}
    >
      {children}
    </span>
  );
}
