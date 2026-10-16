/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#071727",
        panel: "#122D44",
        gold: "#C18B2C",
        "gold-soft": "#E3C27E",
        teal: "#087F77",
        paper: "#F7F4EE",
        ink: "#0E1A26",
        muted: "#5D6B78",
        mist: "#C9D3DC",
        sunrise: "#F4B740",
        coral: "#E8603C",
        lagoon: "#22B8B0",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Public Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
