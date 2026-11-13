# Design audit and fix plan

Date of audit: 2026-11-13. Method: every figure below was measured, not guessed. Source counts come from scanning `app/` and `components/`. Rendered figures come from loading each route in a browser and reading the computed font size of every visible piece of text (share of characters per size). Nothing has been changed yet; this document is the plan.

## 1. The short version

The site does not have a design system. It has about 1,000 individual styling decisions made one component at a time. That is why it feels random: sizes, greys, corners, control heights and heading styles all vary from page to page and sometimes inside one card.

Three root causes explain most of what you see:

1. **A root scale hack makes sizes inconsistent.** `app/globals.css` sets the page root to 110% on screens 768px and wider. Everything written in `rem` (`text-xs`, `text-sm`, `text-base`) grows by 10%. Everything written in pixels (`text-[11px]`, `text-[13px]`, `text-[15px]`) does not. So on desktop `text-xs` renders at 13.2px while `text-[13px]` renders at 13px. They look the same but are different sizes, and 11px text sits next to 13.2px text. On a phone the root is 100%, so the same classes render at different sizes again.
2. **There is no type scale.** The code uses 13 different arbitrary pixel sizes plus 8 Tailwind sizes. The class `text-[11px]` alone appears 119 times. Pages end up with 9 to 12 different font sizes on one screen.
3. **Muted text is built from 14 different opacity levels** (`text-black/20` up to `text-black/90`). Many of them are too faint to read (see section 4C).

Fixing the system once, then moving pages onto it, is faster and safer than fixing screens one by one.

## 2. What was measured

### 2.1 Source counts (whole site)

| Item | Finding |
| --- | --- |
| Arbitrary pixel font sizes | 13 different values: 10, 11, 12, 13, 15, 16, 17, 19, 20, 22, 34, 44, 52 px |
| `text-[11px]` | 119 uses. `text-[15px]`: 32. `text-[13px]`: 20. `text-[10px]`: 15 |
| Tailwind sizes in use | xs (310), sm (251), xl (54), 2xl (48), base (44), 3xl (29), 4xl (23), lg (22) |
| Font families | Plus Jakarta Sans (body), Space Grotesk (display), system mono. Used 379 / 101 / 97 times. Three families is fine; the problem is when each is used |
| Heading styles | `h1` is consistent (24 of 27 pages use the same classes, which is good). `h2` has 8 different size combinations. `h3` has 4 |
| Line heights | 12 different values (relaxed, 6, 7, 5, snug, tight, none, 4 and 5 custom ones) |
| Corner radius | 7 kinds: rounded, sm, md, lg, xl, 2xl, full. Cards use xl, lg, md and plain interchangeably |
| Control heights | h-7, h-8, h-9, h-10, h-11, h-12 all in use |
| Muted text colour | 14 opacity levels in light mode, 7 grey levels in dark mode |
| Spacing between sections | `mb-2, 3, 4, 5, 6, 7, 8, 9, 10, 12` all common. No rhythm |
| Page width | Most pages use `max-w-4xl` with the same gutters (good). The home page uses a different container |

### 2.2 Rendered type on each page (desktop, share of all text)

"Under 12px" is text smaller than 12px. "Under 14px" includes it. "Sizes" is the count of distinct font sizes seen on the page.

| Page | Sizes | Under 12px | Under 14px | Notes |
| --- | --- | --- | --- | --- |
| `/leaderboard` | 10 | **52%** | 71% | Over half of all text is 11px. Worst page |
| `/pricing` | 9 | 28% | 66% | 11px, 13px, 13.2px, 15px and 15.4px all mixed |
| `/timeline` | 9 | 23% | 25% | Dates and metadata at 11px |
| `/companies/google` | 10 | 16% | 38% | Mixes 11, 13, 13.2, 15, 15.4 and 17.6px |
| `/changelog` | 7 | 13% | **85%** | Almost the whole page is small text |
| `/` (home) | 12 | 8% | 60% | 12 different sizes on one screen |
| `/models/<id>` | 10 | 5% | 55% | 13 vs 13.2 and 15 vs 15.4 side by side |
| `/docs` | 12 | 3% | 72% | 12 sizes |
| `/best` | 10 | 2% | 42% | Reasonable |
| `/compare/<pair>` | 9 | 4% | 29% | Reasonable |
| `/score` | 10 | 1% | 28% | Reasonable |
| `/trust` | 6 | 1% | 29% | Closest to a clean page |
| `/open-source` | 6 | 4% | 27% | 15px body next to 13.2px |

On a phone, `/leaderboard` is 44% at 11px and 43% at 12px: 87% of the page is 12px or smaller.

On these pages, "interactive elements shorter than 32px" is common: 78 on the home page, 123 on `/score`, 64 on a model page. Many are inline links, which is acceptable, but the buttons, tabs and chips among them are too small to tap comfortably.

## 3. Design principles this audit uses

These are the standard rules a design lead would apply. Each finding below breaks one of them.

1. **One type scale.** A small, fixed set of sizes, each with a job. Fewer sizes make a page look calmer and more professional than many close ones.
2. **Visual hierarchy.** The eye should find the title, then the key number, then detail. That needs clear steps in size and weight, not 1px differences.
3. **Readable minimum.** Body and data text at 14px or larger. Nothing below 12px. Small text only for short metadata such as a date or an id, never for sentences.
4. **Contrast.** Text must meet 4.5 to 1 against its background (WCAG AA). Grey that is too light is unreadable for many people and in sunlight.
5. **Consistency.** The same job always looks the same: one card style, one heading style per level, one button, one dropdown, one disclosure pattern.
6. **Proximity and rhythm.** Spacing follows a scale (4, 8, 12, 16, 24, 32, 48). Related things sit close; unrelated things get more space. Random gaps look careless.
7. **Alignment and grid.** Left edges and baselines line up. Numbers are right-aligned and tabular so columns read cleanly.
8. **Progressive disclosure.** Show the answer first. Put detail behind a click. Never show empty or "not available" text.
9. **Touch targets.** At least 44px on phones, 36px minimum on desktop controls.
10. **Resilience.** Layouts must survive short and very long text, many or few items, and every screen width, without stretching or leaving gaps.
11. **Restraint with colour.** One accent. Status colours only for status.

## 4. Findings

Severity: **P0** breaks trust or readability, **P1** clearly inconsistent, **P2** polish.

### 4A. Type scale (P0)

- Root 110% hack makes `rem` and `px` sizes disagree (see section 1). Result on a desktop screen: 11, 12, 13, 13.2, 15, 15.4, 17, 17.6, 19.8, 22 and more, all on one page.
- 13px vs 13.2px and 15px vs 15.4px are visually identical but technically different. This is pure noise.
- Phones render a different scale from desktop for the same classes.
- 119 uses of 11px and 15 uses of 10px. These are too small for anything except tiny labels. Files with the most 10 to 11px text: `app/docs/page.tsx` (17), `components/model-details-modal.tsx` (16), `components/home-client.tsx` (14), `components/share-card-modal.tsx` (11), `components/footer.tsx` (7), `components/companies-client.tsx` (7), `app/companies/[id]/page.tsx` (7), `components/model-page-view.tsx` (7).

### 4B. Hierarchy (P1)

- Section headings (`h2`) use 8 different styles. A reader cannot tell what level a heading is.
- On the model page, the title, the lab note and small metadata were within 1 to 2px of each other until the benchmark rows were rebuilt. The same pattern remains elsewhere: list titles and their descriptions are often the same size and weight.
- Card titles, table headers and field labels all look alike.

### 4C. Contrast (P0)

Light mode text on the cream background, approximate contrast ratio:

| Class | Uses | Approx. contrast | Result |
| --- | --- | --- | --- |
| `text-black/30` | 16 | 2.0 to 1 | Fails badly |
| `text-black/35` | 14 | 2.4 to 1 | Fails |
| `text-black/40` | 62 | 2.8 to 1 | Fails |
| `text-black/45` | 80 | 3.2 to 1 | Fails |
| `text-black/50` | 105 | 3.8 to 1 | Fails |
| `text-black/55` | 49 | 4.4 to 1 | Borderline |
| `text-black/60` | 112 | 5.0 to 1 | Passes |

About 277 uses fail. Dark mode: `text-zinc-500` (192 uses) and `text-zinc-600` (21) are also under 4.5 to 1. This is the main reason "small grey text" feels unreadable: it is both small and low contrast.

### 4D. Spacing and layout (P1)

- Gaps between sections use ten different values. No consistent rhythm.
- Cards: some have borders, some have a tinted fill, some both, with three different corner radii (lg, xl, 2xl) for the same job.
- Page containers are consistent on most pages, but the home page and a few widgets break the grid.
- Rows in lists use different padding (`py-2.5`, `py-3`, `py-3.5`) with no rule.

### 4E. Controls (P1)

- Buttons and inputs are 28, 32, 36, 40, 44 or 48px tall depending on the file.
- Three separate dropdown implementations: `model-picker.tsx` (listbox), `compare-picker.tsx` (searchable combobox), and the native or ad hoc selects in the filter controls.
- Four accordion styles: native `<details>` with different summaries on the sources strip, FAQ, providers and the compare directory.
- Tabs, chips and pills each exist in several looks.

### 4F. Page specific (P0 to P1)

- **/leaderboard:** 52% of text at 11px. Rows are dense with tiny grey labels. Needs a larger row, one clear number per row, and metadata moved behind hover or a row expand.
- **/pricing:** 28% at 11px, mixed 13/13.2/15/15.4. Table needs a proper type scale and right-aligned tabular numbers.
- **/timeline:** dates and metadata at 11px with low contrast.
- **/changelog:** 85% of text under 14px. Reads as fine print.
- **Company pages:** 6 different sizes inside one card list; 13 and 15 pixel sizes next to rem sizes.
- **Home:** 12 sizes. The hero uses 34/44/52px custom sizes while the rest follow nothing.
- **/docs:** 17 uses of 10 to 11px in one file. Code and endpoint tables need a mono scale of their own.
- **Modals** (`model-details-modal`, `share-card-modal`): 27 uses of 10 to 11px combined.

### 4G. Mobile (P1)

- Sizes differ from desktop because of the root hack.
- Leaderboard: 87% of text 12px or smaller.
- Several controls under 36px high; filter icons are 28px.
- No horizontal overflow was found on the pages checked, which is good.

### 4H. Content density (P1)

Several pages still show text a reader does not need at first sight. The rule for the fix is progressive disclosure: one-line summary first, detail behind a control. Already done on the model page (sources strip, FAQ, providers, comparisons list, independent results). Still to apply: leaderboard rows, company pages, timeline entries, pricing notes, docs, `/score`.

### 4I. Things I got wrong in my own recent edits (so they are fixed too)

- I treated `text-sm` as 14px and `text-xs` as 12px. On desktop they are 15.4px and 13.2px because of the root hack. The new `/compare` picker and the model-page rows were sized against the wrong numbers, so they do not match older pages exactly.
- I added more arbitrary sizes (`text-[13px]`) in places. These must go too.
- The model-page footer, provider table and FAQ use the new smaller style while the rest of the card uses the old one. That is the "different looks" you noticed.

## 5. The target system

### 5.1 Type scale

Decision needed first: **remove the 110% root hack** and set sizes explicitly, so phone and desktop follow the same tokens and nothing depends on a global multiplier.

Proposed scale (sizes in px, line height in px):

| Token | Phone | Desktop | Job |
| --- | --- | --- | --- |
| `caption` | 12 / 16 | 12 / 16 | Dates, ids, units. Short only. Never a sentence |
| `small` | 14 / 20 | 14 / 20 | Secondary text, table cells, controls, captions under values |
| `body` | 15 / 24 | 16 / 26 | Reading text, answers, descriptions |
| `label` | 14 / 20 semibold | 14 / 20 semibold | Field names, row titles, tab text |
| `title` | 17 / 24 semibold | 18 / 26 semibold | Card titles, row titles that need weight |
| `heading` | 20 / 28 | 22 / 30 | Section headings (`h2`). One style only |
| `page` | 28 / 34 | 36 / 42 | Page title (`h1`). Already consistent |
| `display` | 36 / 40 | 52 / 56 | Home hero only |
| `number` | 20 / 24 | 24 / 28 | Key figures in tiles. Tabular numerals |
| `mono` | 13 / 20 | 13 / 20 | Code and ids |

Rules:

1. At most 6 distinct sizes on any page.
2. No text under 12px, anywhere.
3. Caption size (12) only for metadata words and numbers, never for sentences.
4. Content pages: at least 90% of text at 14px or larger.
5. Numbers in columns: tabular numerals and right aligned.
6. Titles and their descriptions must differ by at least one step in size and one in weight or colour.

### 5.2 Text colour

Replace the 14 opacity levels with three tokens that all pass 4.5 to 1:

| Token | Use | Light | Dark |
| --- | --- | --- | --- |
| `text-strong` | Titles, key values | near black | near white |
| `text-body` | Reading text | 75% black | zinc-300 |
| `text-muted` | Metadata, captions | 62% black (about 5 to 1) | zinc-400 |

Disabled and placeholder text get their own token. Nothing below 4.5 to 1 except disabled.

### 5.3 Spacing, shape and controls

- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Section gap 32 desktop, 24 phone. Heading to content 12. List row padding 12 vertical.
- Radius: two values only. 8px for controls and tiles, 12px for cards and modals. Pills and avatars are full.
- Control height: 36px desktop, 44px on touch screens for every button, input, select and tab. One size, plus one compact (28) for table row actions only.
- One card style: soft tinted tile (current spec tile look) for content, bordered card only for interactive or grouped containers.
- One accent colour (the orange). Green only for positive status, amber only for caution, red only for errors.

### 5.4 Shared components to build once

1. `Section` (heading + optional caption + content, sets spacing).
2. `Tile` (the soft tile) and `Card`.
3. `Disclosure` (single accordion pattern used by sources, FAQ, providers, directories).
4. `Combobox` (one dropdown, searchable; used by job picker and compare picker).
5. `Button`, `IconButton`, `Chip`, `Tabs`, `Badge`.
6. `DataTable` (right aligned tabular numbers, sticky header, readable row height).
7. `MetricRow` (label + bar + value; already built on the model page).

## 6. The plan

### Phase 0: decisions (owner, short)

1. Approve the scale in 5.1 and removal of the 110% root scale.
2. Approve the three text colours in 5.2.
3. Approve the two radii and the control heights.
4. Confirm which pages are most important to launch first (suggested order below).

### Phase 1: foundations (about 1 day)

- Put the scale, colours, spacing and radii into `tailwind.config.ts` and `globals.css` as tokens (for example `text-small`, `text-muted`).
- Remove the root 110% rule. Check that nothing else depended on it.
- Add the tokens to dark mode with the contrast values above.

### Phase 2: shared components (about 2 days)

- Build the components in 5.4 from the pieces that already work (model-page benchmark rows, sources strip, compare picker, provider table).
- Add a small page in dev only that shows every component at every size, light and dark, with short and very long text. This is the visual test bench.

### Phase 3: migrate pages (about 4 to 6 days)

Order by traffic and damage:

1. Model page (finish: remaining old blocks, specs tiles, quickstart, variants, siblings).
2. Home and `/best` (first screen, the picker).
3. `/leaderboard` (worst offender), then `/compare` and `/compare/<pair>`.
4. Company pages, `/timeline`, `/pricing`, `/changelog`.
5. `/score`, `/docs`, `/trust`, `/methodology`, `/open-source`, remaining static pages.
6. Modals (`model-details-modal`, `share-card-modal`), header, footer.

Each page: replace arbitrary sizes and opacity greys with tokens, replace one-off cards, buttons and accordions with shared components, apply progressive disclosure to anything wordy.

### Phase 4: guardrails so it stays fixed (about 1 day)

- A test (extending the existing `scripts/test-site-integrity.js`) that fails the build if source contains `text-[Npx]` font sizes, `text-black/NN` greys outside the tokens, or `rounded-*` values outside the two allowed.
- A browser script (the same measurement used for this audit) run per route: fails if a page has more than 6 distinct sizes, any text under 12px, or more than 10% of text under 14px on content pages.
- A contrast check on the token colours.

### Phase 5: QA

Check every route at 375, 768 and 1280px, light and dark, with browser zoom at 200%, with a very long model name and with empty data. Check keyboard focus order and visible focus rings on every control.

## 7. How we will know it worked

| Measure | Now | Target |
| --- | --- | --- |
| Distinct font sizes on a page | 6 to 12 | 6 or fewer |
| Text under 12px | up to 52% | 0% |
| Text under 14px (content pages) | 25% to 85% | 10% or less |
| Arbitrary pixel font sizes in code | 13 kinds, 200+ uses | 0 |
| Muted text meeting 4.5 to 1 | about 50% | 100% |
| Heading styles for `h2` | 8 | 1 |
| Control heights | 6 | 2 |
| Card corner radii | 7 | 2 |
| Dropdown implementations | 3 | 1 |
| Accordion styles | 4 | 1 |

## 8. Risks and notes

- Removing the root 110% changes the size of everything written in `rem` on desktop (about 10% smaller). Because the new scale is explicit this is intended, but each page needs a visual check.
- A global change touches many files. Doing it in the order above, behind the new tokens, lets each page be checked and shipped on its own.
- Some pages (`/docs`, `/score`) are long reference pages. They need density and structure work, not just size changes.
- Charts and the share-card image have their own typography and should be treated as a separate small task after Phase 3.

## 9. Not covered by this audit

Motion and animation, the share-card image rendering, email and open-graph image design, and print styles. Accessibility beyond contrast, target size and focus (screen reader labels, full keyboard paths) deserves its own pass after the system is in place.
