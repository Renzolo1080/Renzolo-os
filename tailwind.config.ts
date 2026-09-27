import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0A1B33",
        gold: "#C0862E",
        teal: "#0E6E68",
        cream: "#F6F1E6",
      },
    },
  },
  plugins: [],
};
export default config;
