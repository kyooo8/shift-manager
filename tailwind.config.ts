import { type Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss/types/config";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  plugins: [
    function (api: PluginAPI) {
      const { addUtilities } = api;
      const newUtilities = {
        ".no-marker": {
          "list-style": "none",
        },
        ".no-marker::-webkit-details-marker": {
          display: "none",
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;
