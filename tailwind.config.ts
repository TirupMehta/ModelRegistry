import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        accent: "var(--accent)",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        "smooth-out": "cubic-bezier(0.25, 0.1, 0.25, 1)",
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
}
export default config
