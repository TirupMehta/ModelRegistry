import localFont from "next/font/local"

// Self-hosted variable fonts (latin subsets) - previously served via
// next/font/google, which hard-fails the production build whenever the
// Google Fonts fetch flakes in CI. Same files, zero network at build time.
export const sans = localFont({
  src: "../public/fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "200 800",
})

export const display = localFont({
  src: "../public/fonts/space-grotesk-latin.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "300 700",
})
