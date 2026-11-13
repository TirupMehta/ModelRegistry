/**
 * scripts/test-design-tokens.js
 * Keeps the type and colour system from drifting back into one-off values.
 * Fails on: arbitrary pixel font sizes, Tailwind's default size names, raw
 * opacity greys for text, and any text size below the caption token.
 * See docs/design-audit.md for the scale and the reasons.
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
let failures = 0

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) {
      if (!["node_modules", ".next"].includes(entry)) walk(full, out)
    } else if (full.endsWith(".tsx")) out.push(full)
  }
  return out
}

function check(name, offenders) {
  if (offenders.length === 0) {
    console.log(`  ✓ ${name}`)
    return
  }
  failures++
  console.error(`  ✗ ${name}`)
  for (const line of offenders.slice(0, 8)) console.error(`      ${line}`)
  if (offenders.length > 8) console.error(`      ... and ${offenders.length - 8} more`)
}

const files = [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "components"))]
const rules = [
  ["no arbitrary pixel font sizes (use caption, small, body, title, heading, page, display)", /(^|[\s"'`:])text-\[\d+(\.\d+)?(px|rem)\]/],
  ["no Tailwind default font size names (xs, sm, base, lg, xl, 2xl ...)", /(^|[\s"'`:])text-(xs|sm|base|lg|xl|[2-9]xl)(?=[\s"'`]|$)/],
  ["no raw opacity greys for text (use text-fg-strong, text-fg, text-fg-muted)", /text-black\/\d+/],
  ["no native select element (use components/select.tsx so every dropdown looks the same)", /<select[\s>]/],
  ["no hand-written divider lines (use the rule-t / rule-b classes in globals.css)", /border-[tb] border-black\/10 dark:border-white\/\[0\.08\]/],
  ["no hand-written soft panels (use the tile / tile-link classes in globals.css)", /bg-black\/\[0\.0(15|2|25)\]/],
  ["no hand-written page column (use the page class in globals.css)", /max-w-4xl mx-auto w-full px-4|mx-auto w-full max-w-4xl px-4/],
]

for (const [name, re] of rules) {
  const offenders = []
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/)
    lines.forEach((line, i) => {
      if (re.test(line)) offenders.push(`${path.relative(ROOT, file)}:${i + 1}`)
    })
  }
  check(name, offenders)
}

// Elements that must keep their size. A size change here is a regression, not a cleanup.
const KEEP = [
  ["components/header-brand.tsx", "text-headline", "the ModelRegistry wordmark (33px on desktop)"],
  ["components/model-details-modal.tsx", "text-headline", "the model modal title"],
  ["components/home-client.tsx", "text-display", "the home hero headline"],
]
check(
  "key titles keep their size token",
  KEEP.filter(([file, token]) => !fs.readFileSync(path.join(ROOT, file), "utf8").includes(token)).map(([file, , what]) => file + ": " + what),
)

if (failures) {
  console.error(`\n❌ test-design-tokens failed with ${failures} failure(s).`)
  process.exit(1)
}
console.log("\n✔ test-design-tokens: the type and colour system is intact.")
