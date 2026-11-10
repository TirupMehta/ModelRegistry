import { SITE_NAME, SITE_URL } from "./site"

/**
 * One entity graph for the whole site.
 *
 * Search engines and answer engines reconcile "who built this" by matching
 * `@id` values, so the Person node deliberately reuses the identifier that
 * tirup.in and blogs.tirup.in already publish. Three domains, one person, no
 * competing entities for an indexer to merge on its own.
 */
export const PERSON_ID = "https://tirup.in/about"
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const DATASET_ID = `${SITE_URL}/api/v1/models`

export const AUTHOR_NAME = "Tirup Mehta"
export const AUTHOR_URL = "https://tirup.in"
export const AUTHOR_GITHUB = "https://github.com/TirupMehta"

/** Profiles already asserted on tirup.in and blogs.tirup.in, so nothing new is claimed here. */
export const PERSON_SAME_AS = [
  "https://tirup.in",
  "https://blogs.tirup.in",
  "https://github.com/TirupMehta",
  "https://www.linkedin.com/in/TirupMehta",
  "https://x.com/TirupMehta",
  "https://peerlist.io/tirupmehta",
  "https://www.kaggle.com/TirupMehta",
  "https://medium.com/@TirupMehta",
]

export const personNode = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: AUTHOR_NAME,
  // Name variants people actually type, including the honorific form. This is
  // the machine-readable side of "mr tirup mehta", not keyword stuffing in copy.
  alternateName: ["Mr Tirup Mehta", "TirupMehta", "Tirup Mehta (TirupMehta)"],
  url: AUTHOR_URL,
  image: "https://tirup.in/profile.png",
  jobTitle: "Student Software Engineer",
  description:
    "Software engineering student and security researcher in Gujarat, India. Builds and maintains ModelRegistry, an open registry of frontier AI model specifications.",
  knowsAbout: [
    "AI model registry",
    "Frontier language models",
    "Large language model specifications",
    "Context windows",
    "AI model pricing",
    "Open-weight models",
    "Benchmark provenance",
    "Software engineering",
    "Web security",
  ],
  sameAs: PERSON_SAME_AS,
}

export const organizationNode = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  alternateName: ["ModelRegistry", "Model Registry", "ModelRegistry by Tirup Mehta"],
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/icon.svg`,
  },
  description:
    "Open, source-linked registry of frontier AI model specifications: context windows, parameters, pricing, release dates, and lab-published benchmarks.",
  founder: { "@id": PERSON_ID },
  // Trust anchors agents check before recommending a site. The contact channel
  // is the issue tracker and the /contact page: no mailbox or phone number is
  // published, so none is claimed here.
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "technical support",
      url: `${SITE_URL}/contact`,
      availableLanguage: ["English"],
      areaServed: "Worldwide",
    },
  ],
  address: {
    "@type": "PostalAddress",
    addressRegion: "Gujarat",
    addressCountry: "IN",
  },
  // Product terms an answer engine can resolve the brand against. These match
  // the visible copy, the page title, and CORE_KEYWORDS - not extra claims.
  knowsAbout: [
    "AI model registry",
    "Frontier AI models",
    "LLM specifications",
    "Context window comparison",
    "AI model pricing",
    "Open-weight models",
    "Benchmark provenance",
    "Model release history",
  ],
  keywords: [
    "ModelRegistry",
    "AI model registry",
    "frontier models",
    "LLM registry",
    "model specifications",
    "context window comparison",
    "AI model pricing",
    "OpenAPI",
    "JSON API",
  ],
  sameAs: [AUTHOR_GITHUB + "/ModelRegistry"],
  // Trust anchors an answer engine can follow: the rules the site publishes
  // about itself, and where corrections land. Both point at pages that exist
  // and say the same thing in prose.
  publishingPrinciples: `${SITE_URL}/editorial-policy`,
  correctionsPolicy: `${SITE_URL}/changelog`,
  actionableFeedbackPolicy: `${SITE_URL}/contact`,
}

export const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "A source-linked registry of frontier AI models, with release history, lab-reported specifications, and verification status.",
  publisher: { "@id": ORGANIZATION_ID },
  author: { "@id": PERSON_ID },
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

/**
 * The queries this site can actually answer.
 *
 * "Model registry" unqualified belongs to MLOps tooling (MLflow, SageMaker,
 * Vertex AI), which stores a team's own trained artifacts. That is a different
 * product, so the head term is paired with the qualifiers people type when they
 * mean a registry of public models instead: AI model registry, LLM registry,
 * frontier model index, model specifications, context window and pricing
 * comparisons. Branded and person terms lead because those are winnable
 * outright while the category terms are not.
 */
export const CORE_KEYWORDS = [
  // Brand and person
  "ModelRegistry",
  "Model Registry",
  "ModelRegistry AI",
  "Tirup Mehta ModelRegistry",
  "ModelRegistry by Tirup Mehta",
  "Tirup Mehta",
  "Mr Tirup Mehta",
  "TirupMehta",
  // Category, qualified
  "AI model registry",
  "LLM registry",
  "frontier AI model index",
  "AI model database",
  "public model registry",
  "open model registry",
  "AI model specifications",
  // Comparison and data intent
  "context window comparison",
  "AI model pricing comparison",
  "AI model leaderboard",
  "open weights models",
  "foundation model list",
  "latest AI models",
  "new AI models 2026",
]
