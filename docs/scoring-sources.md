# Scoring sources and rubric

Status: DRAFT for owner review. Nothing here is implemented. Written 2026-11-13.

This document answers one question: which external results are allowed to move a
model's score, and why. It comes before any algorithm, because an algorithm can
only be as honest as its inputs.

## 1. Principles

1. **A score is a claim about evidence, not about the model.** Every number on the
   site must be traceable to a named source, a date and a method.
2. **The seller does not grade itself.** Laboratory-reported results are shown,
   attributed and labelled. They never move a ranking.
3. **One capability, counted once.** A composite index and its own components are
   never both inputs, or the same test is counted twice.
4. **Agreement beats volume.** A capability is called well measured only when two
   independent evaluators point the same way. One source is labelled single-source.
5. **Usage is not quality.** Adoption signals decide what we list, never how good
   a model is.
6. **A source can be dropped.** Every source is re-scored on a schedule and has
   written disqualification triggers.

## 2. Evidence tiers

| Tier | What it is | May move a ranking? | Example |
|---|---|---|---|
| A | Independent, same harness for every model | Yes | Artificial Analysis suite |
| B | Independent but heterogeneous, or a compilation | Only after provenance per row is visible | Epoch Capabilities Index inputs |
| C | Reported by the model's maker | No. Shown, attributed, checked against tier A | Launch-post tables |
| D | Usage or popularity | No. Used for inclusion and context only | OpenRouter token rankings |

## 3. Gates (all must pass to be used in a ranking)

- **G1 Independence.** The party running the test does not build or sell the model
  being tested. Partial credit does not exist: mixed sources are tier B.
- **G2 Uniform protocol.** Every listed model faced the same tasks under the same
  harness, and the page says so. Differences in effort setting are recorded.
- **G3 Public method.** The test, its version and how it is scored are documented
  at a stable address.
- **G4 Fresh.** Updated within 60 days at the time we read it. A source that says
  it is no longer maintained fails.

Access is scored separately (section 4, criterion C4) because a good source we
cannot read automatically is still usable, only slower and more error-prone.

## 4. Scored criteria (0 to 3 each)

| # | Criterion | 0 | 3 |
|---|---|---|---|
| C1 | Coverage of in-scope current models | under 10% | over 60% |
| C2 | Access | manual copy only, or blocked | documented download or API |
| C3 | Contamination resistance | public static set | private or held-out, or refreshed continuously |
| C4 | Headroom | top models above 90% | top models below 70% |
| C5 | Discrimination | most models within a few points | wide spread across the field |
| C6 | Uncertainty published | none | interval or sample size per score |
| C7 | Construct validity | unclear what it measures | matches work people really do |
| C8 | Replicability | no run-to-run variance information | variance and settings documented |

A source enters the ranking inputs at 16 of 24 or higher with all gates passed.
Between 10 and 15 it is on the watch list. Below 10 it is not used. Scores are
written down with the evidence next to them and reviewed every quarter.

## 5. Candidate register

What was actually read on 2026-11-13. "Unread" means the page could not be read
by a plain fetch (for example it renders in the browser only) and nothing is
claimed about it. Several of these were read through a summarising fetch, so
values need a second look before they are used.

| Source | Run by | Gates | What was verified | Decision |
|---|---|---|---|---|
| Artificial Analysis Intelligence Index and its nine components | The evaluator, on every model | G1 pass, G2 pass, G3 pass, G4 pass (pages updated within days) | Server-rendered tables we already parse; 25 of 45 current models have all nine tests. Effort setting differs per model. Some tasks are private so cannot be audited. Their composite weighting is theirs. | ADOPT as the spine. Use components, not the composite. Never the only source behind a claim. |
| arena.ai Text Arena | Blind human votes, run by arena.ai | G1 pass, G2 pass, G3 pass, G4 pass (board dated 2026-11-09) | 19 of 45 current models, each with a printed interval and vote count. Automated fetch returns HTTP 403, so refresh is manual. | ADOPT as a separate preference axis. Ask arena.ai about data access. |
| Epoch Capabilities Index (ECI) | Epoch AI | G1 partial (they run some tests, collect others), G2 unclear, G3 pass, G4 pass | Bayesian model fitted jointly over more than 50 benchmarks; difficulty and slope inferred; a model needs at least 4 benchmarks; credible intervals in the downloadable CSV; excludes Elo-style benchmarks. The leaderboard table did not render, so model coverage is unknown. | USE AS VALIDATION TARGET. Compare our ranking to it. Not an input until per-row provenance is visible. |
| Vals.ai | Vals, 42 benchmarks | G1 pass, G2 pass for public benchmarks, G3 partial, G4 pass (2026-11-13) | Methodology page: models are called "through a fixed harness that we control"; for selected public benchmarks "we run every model ourselves under the same harness and settings" (Terminal-Bench and SWE-bench among them). Terminal-Bench, Finance Agent v2 and BioMysteryBench use three runs, others one. Test sets for proprietary benchmarks are private. Effort and temperature settings not stated. How the Vals Index is computed is not stated in anything read. Funding and ties to model makers not stated. Fable 5.2, Sonnet 5.5, Carbon, Opus 5.5, Astra, Sol, Argon and DeepSeek V4.1 Flash are listed; Grok 4.7 and Kimi K3.1 Pro are not. | ADOPT-CANDIDATE as the second evaluator for Terminal-Bench and SWE-bench style work, and for professional-work axes. Conditions: record effort settings per model, and do not use the Vals Index until its method is published. |
| ARC Prize, ARC-AGI-3 | ARC Prize Foundation | G1 pass, G2 pass, G3 pass, G4 pass (entries to 2026-11-10) | Policy read in full. Verified board: the Foundation runs the test itself on a semi-private set; sponsors get no privileged access to private or semi-private sets; zero-data-retention agreements are required of providers; one run per model, no averaging; a $10,000 cap per run; configuration (model, reasoning level, token limits) is published, with outputs, costs and per-task scores on Hugging Face; results appear within 30 days of public release. The policy admits "the possibility of limited leakage over time" because tasks go to provider APIs. The Community board is not verified by default. Cost per task is reported. | ADOPT the Verified board only, as the novel-reasoning axis. Never mix in Community entries. |
| Terminal-Bench official, version 4.1 | Terminal-Bench team | Not established | The leaderboard page shows 4.1 only and its rows did not render. The repository README read is out of date (it describes a v0.1.1 beta and points to a newer framework) and states nothing about verification, a mandatory harness, or contamination controls. Artificial Analysis runs 4.0, so the two must never be merged. | WATCH. Needs the leaderboard submission guide read. Vals also runs Terminal-Bench, which may give a second independent run. |
| OpenRouter rankings | OpenRouter, observed traffic | Not applicable (tier D) | Tokens processed over 1, 7 and 30 days, data through 2026-11-12. The page itself says it does not measure quality. Variants are ranked separately. | USE for inclusion and context only. |
| METR time horizons | METR (nonprofit) | G4 fail | Clear method (task length at 50% and 80% success). The page says it is no longer actively updated; last update 2026-09-08. None of the models checked appear. | REJECT for now. Revisit if updates resume. |
| SWE-bench official leaderboards | Submitters; maintainers verify on request | G1 fail, G2 fail, G3 pass | Repository policy read. The repository "holds entries, not artifacts": submitters publish their own predictions and traces. Maintainers verify only on request ("We will run your model on a random subset"); anyone can re-grade a recorded entry. Since 2025-11-18 a Verified submission needs a technical report and an author at an academic institution or established research lab. The scaffold is the submitter's, so one row is a model plus a system, not a model alone. "Bash Only" is a filter on the Verified board, not a separate board. No submission dates and no entries for our models could be read. | NOT AN INPUT. Tier B at best. Revisit only the Bash Only subset, if its scaffold is confirmed uniform and entries are dated. |
| LiveBench | Maintainers not named in the README | G4 fail on the evidence read | README: questions released monthly from recent papers, news and movie synopses, to limit contamination; 18 tasks in 6 categories. The README's latest release is dated 2025-04-25, who runs the leaderboard is not stated, and raw answers and judgments are on Hugging Face. None of our models were seen. | DO NOT USE for now. Revisit if a current release and model coverage can be shown. |
| Scale Labs leaderboards | Scale | G1 pass, G2 likely, G3 partial, G4 not shown (only a 2026 copyright line) | Branded Scale Labs, not SEAL. Boards include HLE (Diamond), SWE Atlas, SWE-Bench Pro V2, Professional Reasoning (finance and legal), Remote Labor Index, MCP Atlas, MultiChallenge, HiL-Bench and others. Scores carry a plus-or-minus interval. Private datasets are combined with open ones, and a model is featured only the first time an organisation sees the prompts. Fable 5.2 appears on five or more boards, and Opus 5.5, Astra, Sol and Carbon on several; Grok 4.7, Kimi K3.1 Pro and DeepSeek V4.1 Flash on none seen. Scale sells data services to AI developers; its ties to the models it ranks are not yet researched. | WATCH, high value as a second evaluator for expert reasoning, software engineering and professional work. Needs an update date and the commercial ties recorded before use. |
| Laboratory announcement tables | The labs | G1 fail | Often differ from independent runs: on Terminal-Bench, 7 of 8 independent results were lower than the lab figure, by 7.4 points on average. | TIER C. Show, attribute, compare. |

## 6. From sources to a small set of axes

Ranking by one number hides what people actually need. The input set is organised
into a few capability axes, each with a corroboration rule.

| Axis | What it answers | Candidate inputs | Corroborated today? |
|---|---|---|---|
| Software engineering | Can it change real code? | FrontierCode 2.0 (AA); SWE Atlas and SWE-Bench Pro V2 (Scale, watch); SWE-bench run by Vals (candidate) | Possible once Scale or Vals is adopted |
| Agentic terminal work | Can it run multi-step tasks? | Terminal-Bench 4.0 and Terminal-Bench-Science (AA); Terminal-Bench run by Vals (candidate) | Possible once Vals is adopted |
| Expert reasoning | Hard knowledge and science | HLE-Diamond and CritPt (AA); HLE (Diamond) (Scale, watch) | Possible, but see the note on same-name benchmarks below |
| Novel reasoning | Adapts to unseen problems | ARC-AGI-3 Verified board | Single source, but run by the benchmark's owner under a published policy |
| Professional work | Documents, finance, legal | AA-Briefcase and GDP.pdf (AA); Professional Reasoning (Scale, watch); Vals proprietary benchmarks (candidate) | Possible once Scale or Vals is adopted |
| Factual reliability | Right answers, few inventions | AA-Omniscience | No, one evaluator |
| Human preference | What people choose in blind chats | arena.ai | Single source by nature |
| Cost and speed | What a result costs | AA cost and time per task | Evaluator only |

**Same name is not the same test.** Artificial Analysis reports Humanity's Last Exam as "HLE-Diamond" and Scale reports a "HLE (Diamond)" board. For Claude Fable 5.2 the figures read 80.2% and 72.40; for Claude Opus 5.5, 67.9% and 55.00; for GPT-6 Astra, 63.8% and 60.60. Question sets, scaffolds and settings are not documented well enough to say why. Until they are, two boards with the same benchmark name are treated as two different measurements, shown side by side, and never merged or averaged.

Rule: an axis shown without a corroborating second evaluator is labelled
"single source" on the site. Today every axis carries that label, which is the
honest state and the main reason to widen the sources.

## 7. Governance

- **Register.** Every source has a row here with gates, criteria scores, the date
  read, the exact page, and who read it.
- **Re-score** every quarter and whenever a source changes its method.
- **Disqualification triggers:** no update for 60 days; method changed without a
  version; evidence it accepts unverified self-submissions; page becomes
  unreadable; terms forbid citation.
- **Double counting.** Composites (Artificial Analysis Intelligence Index, Vals
  Index, ECI) are displayed with attribution and never combined with their own
  components.
- **Conflicts of interest.** Funding and commercial relationships of each source
  with model makers have not been researched yet. This must be recorded before
  a source becomes a primary input.

## 8. How the algorithm will use this (preview, not built)

The algorithm consumes only sources that pass the gates, grouped by axis, and
reports per-axis estimates with uncertainty plus a cost view. It is evaluated by
back-testing (hide a known score, predict it) and by agreement with the Epoch
index. Epoch already publishes a Bayesian latent-ability model, so the model
class is not our edge. Our edge has to be narrower and defensible: tier A inputs
only, axes instead of one number, published uncertainty and ties, and a public
back-test.

## 9. Decisions needed from the owner

1. Is depending on one evaluator (Artificial Analysis) for most axes acceptable
   in the short term, if every axis is labelled single source?
2. May we contact arena.ai and Epoch about permitted data access?
3. Do you agree that laboratory-reported scores never move a ranking?
4. Are the eight axes right, or should some be merged (for example coding and
   terminal work)?
5. Should "Professional work" wait for a second evaluator before it is shown?

## 10. Status of the unread sources (updated 2026-11-13)

Read since the first draft: SWE-bench repository policy, LiveBench README, Scale Labs boards, Vals methodology page, ARC Prize testing policy, Terminal-Bench repository README, Epoch data page.

Still not done:

- Epoch ECI data: the file is `benchmark_data.zip` (license: Creative Commons Attribution). It has not been downloaded, so per-model coverage, columns, and whether rows are marked as Epoch runs or external runs are unknown. Downloading needs the owner's approval.
- Terminal-Bench leaderboard submission guide (verification rules for the official 4.1 board).
- Vals per-benchmark method pages, to learn which versions of Terminal-Bench and SWE-bench it runs and its effort settings.
- Scale update dates per board, and the commercial ties of Scale, Vals, Artificial Analysis, arena.ai and Epoch with model makers.
- Exact numbers from Scale, Vals and ARC Prize were read through a summarising fetch and must be re-read from the page before use.
