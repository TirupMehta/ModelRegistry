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
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
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
