/**
 * Live repository snapshot for the /open-source page.
 *
 * Data comes from the public GitHub API (no auth, 60 req/hour per IP) and is
 * cached server-side for 15 minutes. Each endpoint is fetched independently:
 * when one fails or returns an unexpected shape, that section of the snapshot
 * is simply absent and the page renders its honest unavailable state. Nothing
 * here is ever invented - stars, pushes, contributors, and merged pull
 * requests only exist if the API returned them.
 */

export const REPO_OWNER = "TirupMehta"
export const REPO_NAME = "ModelRegistry"
export const REPO_URL = "https://github.com/TirupMehta/ModelRegistry"

const REPO_API = "https://api.github.com/repos/TirupMehta/ModelRegistry"

const GH_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ModelRegistry-site",
}

// Pushes and PRs do not need more precision than 15 minutes, and the soft
// cache keeps the page inside the anonymous API budget on stale-free visits.
const REVALIDATE = 900

export type RepoPush = {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

export type RepoContributor = {
  login: string
  profileUrl: string
  contributions: number
}

export type RepoMergedPull = {
  number: number
  title: string
  author: string
  mergedAt: string
  url: string
}

export type RepoStats = {
  stars: number
  forks: number
  openIssues: number
  license: string
  pushedAt: string
}

export type RepoSnapshot = {
  fetchedAt: string
  stats: RepoStats | null
  pushes: RepoPush[]
  contributors: RepoContributor[] | null
  mergedPulls: RepoMergedPull[] | null
}

type GhRecord = Record<string, unknown>

/** string field with an absent/null guard */
function str(record: GhRecord, key: string): string | null {
  const value = record[key]
  return typeof value === "string" && value.length > 0 ? value : null
}

/** finite integer field with an absent/null guard */
function num(record: GhRecord, key: string): number | null {
  const value = record[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** subject-only fetch: never throws, returns the parsed body or null */
async function gh(path: string, perPage: number): Promise<GhRecord[] | GhRecord | null> {
  try {
    const res = await fetch(`${REPO_API}${path}${path.includes("?") ? "&" : "?"}per_page=${perPage}`, {
      headers: GH_HEADERS,
      signal: AbortSignal.timeout(5000),
      next: { revalidate: REVALIDATE, tags: ["github-repo"] },
    })
    if (!res.ok) return null
    const body = (await res.json()) as unknown
    return body && typeof body === "object" ? (body as GhRecord) : null
  } catch {
    return null
  }
}

function toPushes(body: unknown): RepoPush[] {
  if (!Array.isArray(body)) return []
  return body
    .map((entry): RepoPush | null => {
      const commit =
        entry && typeof entry === "object" ? ((entry as GhRecord).commit as GhRecord | undefined) : undefined
      if (!commit) return null
      const sha = str(entry as GhRecord, "sha")
      const message = str(commit, "message")
      if (!sha || !message) return null
      const committer = (commit.committer as GhRecord | undefined) ?? {}
      const author = str(committer, "name") ?? "unknown"
      const date = str(committer, "date") ?? ""
      return {
        sha,
        // First line only: subject form, like `git log --oneline`.
        message: message.split("\n")[0].trim(),
        author,
        date,
        url: str(entry as GhRecord, "html_url") ?? `${REPO_URL}/commit/${sha}`,
      }
    })
    .filter((p): p is RepoPush => p !== null)
    .slice(0, 8)
}

function toContributors(body: unknown): RepoContributor[] | null {
  if (!Array.isArray(body)) return null
  const list = body
    .map((entry): RepoContributor | null => {
      const login = str(entry as GhRecord, "login")
      if (!login) return null
      const contributions = num(entry as GhRecord, "contributions")
      return {
        login,
        profileUrl: str(entry as GhRecord, "html_url") ?? `https://github.com/${login}`,
        contributions: contributions ?? 0,
      }
    })
    .filter((c): c is RepoContributor => c !== null)
    // Bots carry merged history, not contributed judgement.
    .filter((c) => !/\[bot\]/i.test(c.login))
    .slice(0, 12)
  return list.length > 0 ? list : null
}

function toMergedPulls(body: unknown): RepoMergedPull[] | null {
  if (!Array.isArray(body)) return null
  const list = body
    .map((entry): RepoMergedPull | null => {
      if (!entry || typeof entry !== "object") return null
      const record = entry as GhRecord
      const number = num(record, "number")
      const title = str(record, "title")
      const mergedAt = str(record, "merged_at")
      if (!number || !title || !mergedAt) return null
      const user = (record.user as GhRecord | undefined) ?? {}
      return {
        number,
        title,
        author: str(user, "login") ?? "unknown",
        mergedAt,
        url: str(record, "html_url") ?? `${REPO_URL}/pull/${number}`,
      }
    })
    .filter((p): p is RepoMergedPull => p !== null)
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
    .slice(0, 5)
  return list.length > 0 ? list : null
}

function toStats(body: unknown): RepoStats | null {
  if (!body || typeof body !== "object") return null
  const record = body as GhRecord
  const stars = num(record, "stargazers_count")
  if (stars === null) return null
  const license = (record.license as GhRecord | undefined) ?? {}
  const licenseId = str(license, "spdx_id")
  return {
    stars,
    forks: num(record, "forks_count") ?? 0,
    openIssues: num(record, "open_issues_count") ?? 0,
    license: licenseId && licenseId !== "NOASSERTION" ? licenseId : "custom",
    pushedAt: str(record, "pushed_at") ?? "",
  }
}

/**
 * One snapshot with per-section failure isolation. All four endpoints are
 * cached independently by Next's fetch cache, so a single flaky call only
 * blanks its own section.
 */
export async function fetchRepoSnapshot(): Promise<RepoSnapshot> {
  const [repo, commits, pulls, contributors] = await Promise.allSettled([
    gh("", 1),
    gh("/commits?sha=main", 10),
    gh("/pulls?state=closed&direction=desc", 20),
    gh("/contributors", 20),
  ])

  return {
    fetchedAt: new Date().toISOString(),
    stats: repo.status === "fulfilled" ? toStats(repo.value) : null,
    pushes: commits.status === "fulfilled" ? toPushes(commits.value) : [],
    mergedPulls: pulls.status === "fulfilled" ? toMergedPulls(pulls.value) : null,
    contributors: contributors.status === "fulfilled" ? toContributors(contributors.value) : null,
  }
}
