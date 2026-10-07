import { MetadataRoute } from "next"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://modelregistry.tirup.in"
  // Content-based freshness: the last real data revision — never build time.
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
      url: `${baseUrl}/leaderboard`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.9,
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
      url: `${baseUrl}/docs`,
      lastModified: revisedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: revisedAt,
      changeFrequency: "monthly",
      priority: 0.6,
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
  const modelRoutes: MetadataRoute.Sitemap = modelsData.map((model) => {
    const isSotaOrFlagship =
      model.statusBadge.includes("FLAGSHIP") ||
      model.statusBadge.includes("SOTA") ||
      model.statusBadge.includes("NEWEST")

    return {
      url: `${baseUrl}/models/${model.id}`,
      lastModified: new Date(model.releaseDate),
      changeFrequency: "weekly",
      priority: isSotaOrFlagship ? 0.9 : 0.8,
    }
  })

  // 3. Laboratory Profile Pages (one per tracked lab)
  const labRoutes: MetadataRoute.Sitemap = Object.keys(companies).map((companyId) => {
    const newest = modelsData
      .filter((m) => m.companyId === companyId)
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
    return {
      url: `${baseUrl}/companies/${companyId}`,
      lastModified: newest ? new Date(newest.releaseDate) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }
  })

  // 4. Machine-Readable & Agent Discovery Feeds (crawlable text content only —
  // JSON APIs and CLI text endpoints are intentionally excluded to conserve
  // crawl budget for indexable pages)
  const feedRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/llms-full.txt`,
      lastModified: revisedAt,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rss.xml`,
      lastModified: revisedAt,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/feed.json`,
      lastModified: revisedAt,
      changeFrequency: "hourly",
      priority: 0.7,
    },
  ]

  return [...coreRoutes, ...labRoutes, ...modelRoutes, ...feedRoutes]
}
