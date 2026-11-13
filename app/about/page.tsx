import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { CORE_KEYWORDS, DATASET_ID, ORGANIZATION_ID, PERSON_ID, WEBSITE_ID, PERSON_SAME_AS } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "About ModelRegistry - built and maintained by Tirup Mehta",
  description:
    "ModelRegistry is an open, source-linked registry of frontier AI model specifications, built and maintained by Tirup Mehta. What it covers, how records are verified, and how to query it.",
  keywords: CORE_KEYWORDS,
  authors: [{ name: "Tirup Mehta", url: "https://tirup.in" }],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About ModelRegistry - built and maintained by Tirup Mehta",
    description:
      "An open registry of frontier AI model specifications, maintained by Tirup Mehta. What it covers, how it is verified, and how to query it.",
    url: `${SITE_URL}/about`,
    siteName: "ModelRegistry",
    type: "website",
    images: [{ url: "/api/og?theme=light", width: 1200, height: 630, alt: "About ModelRegistry" }],
  },
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mt-8 mb-3">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[68ch] text-body text-fg leading-6 sm:leading-7 mb-3">
      {children}
    </p>
  )
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-accent-ink hover:underline underline-offset-2">
      {children}
    </Link>
  )
}

export default function AboutPage() {
  const labs = new Set(modelsData.map((m) => m.companyId)).size

  // Questions below are rendered visibly, which is the only condition under
  // which FAQPage markup is legitimate. Nothing here is asked in schema and
  // hidden from the reader.
  const faqs = [
    {
      q: "Who builds ModelRegistry?",
      a: "ModelRegistry is built and maintained by Tirup Mehta, a software engineering student and security researcher based in Gujarat, India. The source code and the dataset are public at github.com/TirupMehta/ModelRegistry.",
    },
    {
      q: "Is ModelRegistry the same as an MLOps model registry?",
      a: "No. An MLOps model registry such as MLflow, SageMaker or Vertex AI stores the models a team has trained itself. ModelRegistry tracks specifications published by AI labs for public frontier models: context window, parameters, pricing, release date and reported benchmark results, each linked to its source.",
    },
    {
      q: "Where does the data come from?",
      a: "Lab announcements, model cards, and provider pricing pages. Every record carries its sources, per-field citations, and a last-verified date. The methodology page explains how sources are chosen and how to report an error.",
    },
    {
      q: "Is ModelRegistry free and open source?",
      a: "Yes. The registry is MIT licensed. The dataset is published as a JSON API alongside RSS, JSON Feed and llms.txt, and it can be read without an account or a key.",
    },
    {
      q: "How current is the dataset?",
      a: `The current dataset revision is ${datasetRevision.datasetVersion}, last updated ${datasetRevision.revisedAt}, covering ${String(modelsData.length)} models across ${String(labs)} labs. Every record cites primary sources with per-field citations and a last-verified date.`,
    },
  ]

  const jsonLdAbout = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about`,
    url: `${SITE_URL}/about`,
    name: "About ModelRegistry",
    description:
      "What ModelRegistry covers, who maintains it, and how its records are verified and queried.",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
    about: [
      { "@id": ORGANIZATION_ID },
      { "@type": "Dataset", "@id": DATASET_ID, name: "Frontier AI Models Specification Registry" },
    ],
    inLanguage: "en",
  }

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/about#faq`,
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ledger", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
    ],
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdAbout) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumb) }} />
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          About ModelRegistry
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>
            Dataset <span className="font-mono tabular-nums">{datasetRevision.datasetVersion}</span>, revised{" "}
            <time dateTime={datasetRevision.revisedAt} className="tabular-nums">{datasetRevision.revisedAt}</time>
          </span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/methodology">Methodology</A>
        </p>

        <P>
          ModelRegistry is an open registry of frontier AI model specifications. For each tracked
          model it records the context window, parameter count, release date, pricing, modalities,
          license and the benchmarks the lab itself reported, with links to the primary sources
          behind every field.
        </P>
        <P>
          It exists because the alternative is reading a dozen lab announcement pages, a pricing
          table and three changelogs to answer one question: what are the current flagship models,
          and what do they actually do? The registry keeps that answer in one place, in a shape both
          people and machines can read.
        </P>

        <H2>What ModelRegistry is not</H2>
        <P>
          The phrase &ldquo;model registry&rdquo; also names a piece of MLOps tooling. MLflow,
          SageMaker and Vertex AI registries store the model artifacts a team trained itself, with
          versions, stages and deployment hooks. ModelRegistry does not store weights, run training,
          or host inference. It indexes what AI labs publish about public frontier models. If you
          arrived looking for artifact versioning, those tools are the right place to look.
        </P>

        <H2>{faqs[0].q}</H2>
        <P>
          ModelRegistry is built and maintained by{" "}
          <Link href="https://tirup.in" className="text-accent-ink hover:underline underline-offset-2">
            Tirup Mehta
          </Link>
          , a software engineering student and security researcher in Gujarat, India. The code, the
          dataset and the source audit are public in the{" "}
          <A href="https://github.com/TirupMehta/ModelRegistry">GitHub repository</A>. Corrections
          and additions go through the <A href="/suggest">suggestion form</A> and a maintainer
          review, so a generated issue never publishes a record on its own.
        </P>
        <P>
          His other work lives at <A href="https://tirup.in">tirup.in</A>, and his writing at{" "}
          <A href="https://blogs.tirup.in">blogs.tirup.in</A>. ModelRegistry is a project of
          TirupMehta, published under the same name on GitHub.
        </P>

        <H2>{faqs[1].q}</H2>
        <P>{faqs[1].a}</P>

        <H2>{faqs[2].q}</H2>
        <P>
          Lab announcements, model cards and provider pricing pages, each linked on the model page
          itself. Records carry per-field citations and a last-verified date rather than an
          implied &ldquo;live&rdquo; badge. The <A href="/methodology">methodology</A> explains the
          inclusion standard, and the{" "}
          <A href="/editorial-policy">editorial policy</A> covers corrections and conflicts.
        </P>

        <H2>{faqs[3].q}</H2>
        <P>
          Yes. The registry is MIT licensed and built in public - commits,
          contributors, and pull requests are on the{" "}
          <A href="/open-source">open-source page</A>. Machine-readable access needs no
          account and no key:
          the <A href="/api/v1/models">JSON API</A>, <A href="/api/v1/snapshot">snapshot</A>,{" "}
          <A href="/rss.xml">RSS</A>, <A href="/feed.json">JSON Feed</A> and{" "}
          <A href="/llms.txt">llms.txt</A> are all public. <A href="/docs">Docs</A> covers the
          endpoints, filters and fields.
        </P>

        <H2>{faqs[4].q}</H2>
        <P>
          The current revision is {datasetRevision.datasetVersion}, last updated{" "}
          {datasetRevision.revisedAt}. It covers {modelsData.length} models across {labs} labs, each
          with primary sources and per-field citations. The{" "}
          <A href="/changelog">changelog</A> records every revision, and the{" "}
          <A href="/timeline">release timeline</A> shows when each model entered the registry.
        </P>

        <H2>How to cite ModelRegistry</H2>
        <P>
          Cite the model page rather than the homepage, and include the revision date, because
          specifications and prices change between releases. Every model page carries its sources,
          its verification status, and a stable URL. Agents that prefer plain text can read{" "}
          <A href="/llms.txt">llms.txt</A> for the summary and{" "}
          <A href="/llms-full.txt">llms-full.txt</A> for the full matrix.
        </P>

        <H2>Elsewhere</H2>
        <ul className="flex flex-col gap-2 text-body text-fg">
          {PERSON_SAME_AS.map((url) => (
            <li key={url}>
              <A href={url}>{url.replace(/^https:\/\/(www\.)?/, "")}</A>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
