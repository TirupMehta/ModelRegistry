import { modelsData } from "@/data/models"

export const dynamic = "force-dynamic"

export async function GET() {
  const siteUrl = "https://modelregistry.tirup.in"
  const sorted = [...modelsData].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  )

  const itemsXml = sorted
    .map((model) => {
      const pubDate = new Date(model.releaseDate).toUTCString()
      const link = model.links.announcement || `${siteUrl}/#${model.id}`

      return `
    <item>
      <title><![CDATA[${model.companyName}: ${model.name} (${model.statusBadge})]]></title>
      <link>${link}</link>
      <guid>${siteUrl}/models/${model.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${model.highlight} | Context Window: ${model.contextWindow} | Category: ${model.categoryLabel}]]></description>
    </item>`
    })
    .join("")

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ModelRegistry — Frontier AI Models &amp; Releases</title>
    <link>${siteUrl}</link>
    <description>The open public registry tracking primary foundation flagships and research checkpoints across all premier AI labs.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  })
}
