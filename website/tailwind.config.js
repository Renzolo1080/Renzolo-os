/** @type {import('tailwindcss').Config} */
/** RENZOLO Vibrant design system: colours from CSS custom properties
 * generated from design/renzolo-vibrant/tokens.json (app/brand-tokens.css).
 * Legacy names map onto the new tokens. */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "surface": "rgb(var(--surface-rgb) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised-rgb) / <alpha-value>)",
        "surface-tint": "rgb(var(--surface-tint-rgb) / <alpha-value>)",
        "ink": "rgb(var(--ink-rgb) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted-rgb) / <alpha-value>)",
        "line": "rgb(var(--line-rgb) / <alpha-value>)",
        "brand": "rgb(var(--brand-rgb) / <alpha-value>)",
        "brand-text": "rgb(var(--brand-text-rgb) / <alpha-value>)",
        "on-brand": "rgb(var(--on-brand-rgb) / <alpha-value>)",
        "gold": "rgb(var(--gold-rgb) / <alpha-value>)",
        "on-gold": "rgb(var(--on-gold-rgb) / <alpha-value>)",
        "teal": "rgb(var(--teal-rgb) / <alpha-value>)",
        "on-teal": "rgb(var(--on-teal-rgb) / <alpha-value>)",
        "teal-text": "rgb(var(--teal-text-rgb) / <alpha-value>)",
        "night": "rgb(var(--night-rgb) / <alpha-value>)",
        "focus": "rgb(var(--focus-rgb) / <alpha-value>)",
        "tick-up": "rgb(var(--tick-up-rgb) / <alpha-value>)",
        "tick-down": "rgb(var(--tick-down-rgb) / <alpha-value>)",
        // Legacy names, mapped onto the system
        navy: "rgb(var(--night-rgb) / <alpha-value>)",
        panel: "#1c1f36",
        paper: "rgb(var(--surface-rgb) / <alpha-value>)",
        muted: "rgb(var(--ink-muted-rgb) / <alpha-value>)",
        mist: "#b4b7ca",
        "gold-soft": "rgb(var(--gold-rgb) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: { pill: "var(--radius-pill)", card: "var(--radius-md)", panel: "var(--radius-lg)" },
      boxShadow: { pop: "var(--shadow-pop)", "pop-hover": "var(--shadow-pop-hover)", soft: "var(--shadow-soft)", glow: "var(--glow-brand)" },
    },
  },
  plugins: [],
};
