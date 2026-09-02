import { MetadataRoute } from "next"
import { modelsData } from "@/data/models"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://modelregistry.tirup.in"
  const now = new Date()

  // 1. Primary Hub Pages
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/timeline`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  // 2. Canonical Dedicated Model Specification Pages (All 17 frontier models)
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

  // 3. Machine-Readable & Agent Discovery Feeds
  const feedRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/llms-full.txt`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rss.xml`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/latest`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/api/v1/models`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ]

  return [...coreRoutes, ...modelRoutes, ...feedRoutes]
}
