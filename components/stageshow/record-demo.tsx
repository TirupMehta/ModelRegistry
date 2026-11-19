"use client"

import { useSyncExternalStore } from "react"
import { Field, Icon, Kbd, Row, Roll, Stage, Swap, Text, Window, type Act } from "./kit"
import { modelsData, type ModelItem } from "@/data/models"
import { SITE_URL } from "@/lib/site"
import { formatDate } from "@/lib/utils"
import "./record-demo.css"

// The homepage demo: open a record and see the lab page it came from and the
// date it was checked. Every string on screen is read from the registry's own
// dataset, so the demo cannot drift from the records it shows.

const ROW_IDS = [
  "claude-fable-5-2",
  "gpt-6-1-sol",
  "grok-4-7",
  "mistral-large-4",
  "kimi-k3-1-pro",
  "qwen-3-8-2-4t-a95b",
] as const

// The story opens on START, the cursor opens TARGET, and the loop ends back on START.
const START = "gpt-6-1-sol"
const TARGET = "mistral-large-4"

type Card = {
  id: string
  name: string
  lab: string
  released: string
  context: string
  input: string
  output: string
  publisher: string
  source: string
  checked: string
}

type S = { id: string }

const HOST = SITE_URL.replace(/^https?:\/\//, "")

/** 1,000,000 → 1M, 1,048,576 → 1.05M, 500,000 → 500K. */
function compactTokens(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(2)}M`
  return `${Math.round(n / 1_000)}K`
}

/** USD per 1M tokens: two decimals, more only under a dime. Matches the index. */
function usd(n: number): string {
  if (n === 0) return "Free"
  return n < 0.1 ? `$${n}` : `$${n.toFixed(2)}`
}

function toCard(model: ModelItem): Card | null {
  const source = model.sources[0]
  if (!source || model.contextWindowTokens <= 0 || model.pricingUnit || model.pricingCurrency) return null
  return {
    id: model.id,
    name: model.name,
    lab: model.companyName,
    released: formatDate(model.releaseDate),
    context: compactTokens(model.contextWindowTokens),
    input: usd(model.pricing.input),
    output: usd(model.pricing.output),
    publisher: source.publisher,
    source: source.title,
    checked: formatDate(model.lastVerifiedAt),
  }
}

const CARDS: Card[] = ROW_IDS.flatMap((id) => {
  const model = modelsData.find((m) => m.id === id)
  const card = model ? toCard(model) : null
  return card ? [card] : []
})
const BY_ID = new Map(CARDS.map((card) => [card.id, card]))
const READY = BY_ID.has(START) && BY_ID.has(TARGET)

const initial: S = { id: START }
const poster: S = { id: TARGET }

async function script(a: Act<S>) {
  await a.wait(1100)
  await a.move(`row-${TARGET}`)
  await a.wait(250)
  await a.click()
  await a.set({ id: TARGET })
  await a.wait(1500)
  // The payoff: where the figures came from, and when it was checked.
  // The pointer stops on the link's arrow, so the words stay readable.
  await a.move({ at: "source", x: 0.97, y: 0.5 })
  await a.wait(2200)
  // Selecting the first record again is the reset: the loop ends where it began.
  await a.move(`row-${START}`)
  await a.wait(250)
  await a.click()
  await a.set({ id: START })
  await a.move("rest")
  await a.wait(1100)
}

// The page follows the site's own theme switch (a class on <html>).
function subscribe(notify: () => void) {
  const watcher = new MutationObserver(notify)
  watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => watcher.disconnect()
}
const isDark = () => document.documentElement.classList.contains("dark")

export default function RecordDemo() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)
  if (!READY) return null

  return (
    <div
      className="rd-host"
      role="img"
      aria-label="Animation: opening a model record shows the lab page its figures came from and the date it was checked."
    >
      <Stage
        width={720}
        height={340}
        compact={{ below: 560, width: 358, height: 356 }}
        initial={initial}
        poster={poster}
        script={script}
        theme={dark ? "dark" : "light"}
        cursor={{ at: { wide: { x: 560, y: 262 }, compact: { x: 306, y: 200 } }, style: "arrow", ripple: true }}
        className="rd"
      >
        {(s, _rect, layout) => {
          const card = BY_ID.get(s.id) ?? CARDS[0]
          const compact = layout === "compact"
          // The phone column has no room for the first rows, so it opens on the ones the story uses.
          const rows = compact ? CARDS.filter((c) => c.id === START || c.id === TARGET) : CARDS
          return (
            <>
              <Window url={HOST} urlShape="pill" className="rd-window" body={{ className: "rd-body" }}>
                <div className="rd-list">
                  {!compact && (
                    <Field
                      className="rd-search"
                      value=""
                      placeholder="Search models"
                      leading={<Icon name="search" size={14} />}
                      trailing={<Kbd keys={["/"]} plain />}
                    />
                  )}
                  <div className="rd-rows">
                    {rows.map((row) => (
                      <Row
                        key={row.id}
                        data-target={`row-${row.id}`}
                        data-cursor="pointer"
                        selected={row.id === s.id}
                        pad={compact ? 6 : 8}
                        title={<Text>{row.name}</Text>}
                        subtitle={<Text>{row.lab}</Text>}
                        meta={<Text className="rd-ctx">{`${row.context} context`}</Text>}
                      />
                    ))}
                  </div>
                </div>

                <div className="rd-pane">
                  <div className="rd-pane-in">
                    <div className="rd-title">
                      <Swap id={card.id}>{card.name}</Swap>
                    </div>
                    <div className="rd-sub">
                      <Swap id={card.id}>{`${card.lab} · Released ${card.released}`}</Swap>
                    </div>

                    <dl className="rd-specs">
                      <div>
                        <dt>Context</dt>
                        <dd>
                          <Roll>{card.context}</Roll>
                        </dd>
                      </div>
                      <div>
                        <dt>Input, per 1M</dt>
                        <dd>
                          <Roll>{card.input}</Roll>
                        </dd>
                      </div>
                      <div>
                        <dt>Output, per 1M</dt>
                        <dd>
                          <Roll>{card.output}</Roll>
                        </dd>
                      </div>
                    </dl>

                    <div className="rd-source">
                      <div className="rd-source-label">Source</div>
                      <div className="rd-link" data-target="source" data-cursor="pointer">
                        <Swap id={card.id} className="rd-link-text">{card.source}</Swap>
                        <Icon name="external" size={14} />
                      </div>
                      <div className="rd-checked">
                        <Swap id={card.id}>{`${card.publisher} · checked ${card.checked}`}</Swap>
                      </div>
                    </div>
                  </div>
                </div>
              </Window>
              <span data-target="rest" className="rd-rest" style={compact ? { left: 306, top: 200 } : { left: 560, top: 262 }} />
            </>
          )
        }}
      </Stage>
    </div>
  )
}
