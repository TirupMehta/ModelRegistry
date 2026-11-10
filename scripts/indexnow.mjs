// Pushes every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver).
// Run after a deploy:  node scripts/indexnow.mjs
const HOST = "modelregistry.tirup.in"
const KEY = "3bb278d13d9d241a2032bd3bac01e662"
const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text()
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
})
console.log(`IndexNow: submitted ${urlList.length} URLs -> HTTP ${res.status}`)
