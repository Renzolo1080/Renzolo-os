import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sourced directly from the RENZOLO brand mockup decks (Sept 2026)
        navy: "#071727", // primary dark navy (site background, footer, headings)
        "navy-panel": "#122D44", // lighter navy for cards/panels on a dark background
        gold: "#C18B2C", // primary accent (buttons, highlights)
        teal: "#087F77", // secondary accent (data viz, icons, links)
        cream: "#F7F4EE", // page background
        ink: "#111111", // primary text on light backgrounds
        "ink-soft": "#68737D", // secondary/muted text (was previously undefined — fixes invisible-color bug)
      },
    },
  },
  plugins: [],
};
export default config;
