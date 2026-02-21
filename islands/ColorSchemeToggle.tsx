import { useEffect, useState } from "preact/hooks";
import Icon from "../components/atoms/Icon.tsx";

type ColorScheme = "light" | "dark" | "auto";

const STORAGE_KEY = "color-scheme";

function getStoredScheme(): ColorScheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable
  }
  return "auto";
}

function applyScheme(scheme: ColorScheme) {
  if (scheme === "auto") {
    document.documentElement.style.removeProperty("color-scheme");
  } else {
    document.documentElement.style.colorScheme = scheme;
  }
}

const iconMap: Record<ColorScheme, string> = {
  light: "light_mode",
  dark: "dark_mode",
  auto: "contrast",
};

const nextMap: Record<ColorScheme, ColorScheme> = {
  auto: "light",
  light: "dark",
  dark: "auto",
};

export default function ColorSchemeToggle() {
  const [scheme, setScheme] = useState<ColorScheme>("auto");

  useEffect(() => {
    const stored = getStoredScheme();
    setScheme(stored);
    applyScheme(stored);
  }, []);

  const toggle = () => {
    const next = nextMap[scheme];
    setScheme(next);
    applyScheme(next);
    try {
      if (next === "auto") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // localStorage unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      class="color-scheme-toggle"
      aria-label={`Color scheme: ${scheme}`}
    >
      <Icon>{iconMap[scheme]}</Icon>
    </button>
  );
}
