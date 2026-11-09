import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"

const config: Config = {
  darkMode: ["class"],
  // Touch devices emulate :hover on tap and leave it stuck - the classic
  // "tapped it and it stayed highlighted" micro-glitch. Gating hover at the
  // variant level means touch UIs only ever show :active press states.
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-ink": "rgb(var(--accent-ink-rgb) / <alpha-value>)",
        good: "rgb(var(--good-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        // Was aliased to the sans face, so every terminal strip, ledger index
        // and keycap rendered in Jakarta. Figures and code get a real mono.
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
    },
  },
  plugins: [
    // Same hover-gating for group-hover (the future flag only covers the
    // plain `hover` variant). No named groups (group/foo) are used, so a
    // plain override is safe - verified, see share-card-modal (no
    // group-hover/* selectors reference it).
    plugin(({ addVariant }) => {
      addVariant(
        "group-hover",
        "@media (hover: hover) and (pointer: fine) { .group:hover & }"
      )
    }),
  ],
}
export default config
