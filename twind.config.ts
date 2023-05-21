import { Options } from "$fresh/plugins/twind.ts";
import * as colors from "twind/colors";

export default {
  darkMode: "media",
  selfURL: import.meta.url,
  theme: {
    extend: {
      colors,
    },
  },
} as Options;
