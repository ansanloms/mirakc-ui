import { Options } from "$fresh/plugins/twind.ts";
import * as colors from "twind/colors";
import { forms } from "@twind/forms";

export default {
  darkMode: "media",
  selfURL: import.meta.url,
  plugins: {
    forms,
  },
  theme: {
    extend: {
      colors,
    },
  },
} as Options;
