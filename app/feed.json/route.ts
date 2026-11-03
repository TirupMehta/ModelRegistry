import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

// JSON Feed 1.1 (https://www.jsonfeed.org/version/1.1/) generated from the
// same dataset as /rss.xml - same items, same ordering, same revision stamp.
export async function GET() {
  const siteUrl = SITE_URL
  const sorted = [...modelsData].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  )

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: `${SITE_NAME} - Frontier AI Models & Releases`,
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    description: SITE_DESCRIPTION,
    _dataset_version: datasetRevision.datasetVersion,
    _dataset_revised: datasetRevision.revisedAt,
    items: sorted.map((model) => ({
      id: `${siteUrl}/models/${model.id}`,
      url: model.links.announcement || `${siteUrl}/?model=${model.id}`,
      title: `${model.companyName}: ${model.name} (${model.statusBadge})`,
      content_text: `${model.highlight} | Context Window: ${model.contextWindow} | Category: ${model.categoryLabel}`,
      date_published: new Date(`${model.releaseDate}T00:00:00Z`).toISOString(),
      date_modified: new Date(`${model.lastVerifiedAt}T00:00:00Z`).toISOString(),
      _verification_status: model.verificationStatus,
      authors: [{ name: model.companyName }],
    })),
  }

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  })
}
