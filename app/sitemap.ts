import { MetadataRoute } from "next"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"
import { comparisonPairs } from "@/lib/seo"
import { bestSlug, buildBestAnswers } from "@/lib/best"
import { buildAlternatives, hasAlternatives } from "@/lib/alternatives"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://modelregistry.tirup.in"
  // Content-based freshness: the last real data revision - never build time.
  const revisedAt = new Date(`${datasetRevision.revisedAt}T00:00:00Z`)
  const now = new Date()

  // 1. Primary Hub Pages
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/best`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/score`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trust`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/timeline`,
      lastModified: revisedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/open-source`,
      lastModified: revisedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: revisedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cli`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: revisedAt,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/editorial-policy`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: revisedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/flagships`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/context`,
      lastModified: revisedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/licenses`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/modalities`,
      lastModified: revisedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/retired`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ]

  // 2. Canonical Dedicated Model Specification Pages (every tracked model)
  //    lastModified is the LATER of release and last source verification, not
  //    the release date alone. 64 of 65 records were re-verified after release;
  //    reporting the release date told Google "unchanged since launch" and cost
  //    these pages recrawl priority.
  const modelRoutes: MetadataRoute.Sitemap = modelsData.map((model) => {
    const isSotaOrFlagship =
      model.statusBadge.includes("FLAGSHIP") ||
      model.statusBadge.includes("SOTA") ||
      model.statusBadge.includes("NEWEST")

    const released = new Date(model.releaseDate)
    const verified = new Date(model.lastVerifiedAt)
    const lastModified =
      !isNaN(verified.getTime()) && verified > released ? verified : released

    return {
      url: `${baseUrl}/models/${model.id}`,
      lastModified,
      changeFrequency: "weekly",
      priority: isSotaOrFlagship ? 0.9 : 0.8,
    }
  })

  // 3. Laboratory Profile Pages (one per tracked lab)
  const labRoutes: MetadataRoute.Sitemap = Object.keys(companies).map((companyId) => {
    const owned = modelsData.filter((m) => m.companyId === companyId)
    const newest = owned
      .slice()
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
    // Same rule as model pages: a lab profile changes when any of its records
    // was last verified, which is usually later than the newest release.
    const newestVerified = owned.reduce((latest, m) => {
      const d = new Date(m.lastVerifiedAt)
      return !isNaN(d.getTime()) && d > latest ? d : latest
    }, new Date(0))
    const released = newest ? new Date(newest.releaseDate) : now
    const lastModified =
      newestVerified.getTime() > 0 && newestVerified > released ? newestVerified : released

    return {
      url: `${baseUrl}/companies/${companyId}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    }
  })

  // 4. Head-to-head comparison pages. Cross-lab pairs only, and the slug is
  //    canonicalised by sorted id so a-vs-b and b-vs-a are one URL, not two.
  const compareRoutes: MetadataRoute.Sitemap = comparisonPairs(modelsData).map(({ a, b }) => ({
    url: `${baseUrl}/compare/${[a.id, b.id].sort().join("-vs-")}`,
    lastModified: revisedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  // 5a. Data stories: the pages most likely to be linked to and cited.
  const insightRoutes: MetadataRoute.Sitemap = ["/insights", "/insights/lab-claims-vs-independent", "/insights/cost-of-intelligence"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: revisedAt,
    changeFrequency: "weekly" as const,
    priority: path === "/insights" ? 0.7 : 0.8,
  }))

  // 5. One page per best-by-task question: each targets its own search intent
  //    ("best AI model for coding", "cheapest AI model API", ...).
  const bestRoutes: MetadataRoute.Sitemap = buildBestAnswers().map((answer) => ({
    url: `${baseUrl}/best/${bestSlug(answer.id)}`,
    lastModified: revisedAt,
    changeFrequency: "daily",
    priority: 0.85,
  }))

  // 6. Alternatives pages ("X alternatives"): one per token-priced text model with at least three real options.
  const alternativeRoutes: MetadataRoute.Sitemap = modelsData
    .filter((m) => hasAlternatives(m) && (buildAlternatives(m)?.total ?? 0) >= 3)
    .map((m) => ({
      url: `${baseUrl}/alternatives/${m.id}`,
      lastModified: revisedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

  // 7. Machine-readable & agent discovery feeds (/llms.txt, /llms-full.txt,
  // /rss.xml, /feed.json) are intentionally NOT listed here. A sitemap must
  // advertise canonical HTML pages you want indexed; feeding plain-text and
  // JSON endpoints into it spends this subdomain's crawl budget on documents
  // Google will never rank, which is a direct cause of "Discovered - currently
  // not indexed" on the pages that do matter. They stay discoverable through
  // robots.txt, llms.txt, and the page footers.

  return [...coreRoutes, ...insightRoutes, ...bestRoutes, ...labRoutes, ...modelRoutes, ...alternativeRoutes, ...compareRoutes]
}
