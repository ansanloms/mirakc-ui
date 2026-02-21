const STORAGE_KEY = "color-scheme";

try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    document.documentElement.style.colorScheme = stored;
  }
} catch {
  // localStorage unavailable
}
