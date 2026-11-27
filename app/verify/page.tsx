import fs from "node:fs"
import path from "node:path"
import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import CopyButton from "@/components/copy-button"
import { SITE_URL } from "@/lib/site"
import { breadcrumbList } from "@/lib/seo"
import { safeJsonLd } from "@/lib/utils"
import { withShare } from "@/lib/share"

export const metadata: Metadata = withShare(
  {
    title: "Verify the ModelRegistry snapshot",
    description:
      "Every file in the ModelRegistry dataset has a published SHA-256 hash and the snapshot root is signed with Ed25519. Check it yourself, offline, in one command.",
    alternates: { canonical: `${SITE_URL}/verify` },
    openGraph: {
      title: "Verify the ModelRegistry snapshot",
      description:
        "A published SHA-256 manifest over every dataset file, plus a detached Ed25519 signature. Verification instructions that do not require trusting this site.",
      url: `${SITE_URL}/verify`,
      siteName: "ModelRegistry",
      type: "website",
    },
  },
  { page: "/verify" },
  "/verify",
)

// Rendered at build time from the committed artifacts, so the page cannot show a
// digest the deployment does not actually serve.
export const dynamic = "force-static"

interface FileEntry {
  path: string
  sha256: string
  bytes: number
}

interface Manifest {
  snapshotVersion: string
  schemaVersion: string
  datasetVersion: string
  revisedAt: string
  generatedAt: string
  recordCount: number
  files: FileEntry[]
  canonicalDataset: { sha256: string; bytes: number; records: number }
  scores: { methodVersion: string; sha256: string; bytes: number; models: number; observations: number }
  rootSha256: string
}

function readArtifacts(): { manifest: Manifest | null; signed: boolean } {
  const manifestPath = path.join(process.cwd(), "public", "verify", "manifest.json")
  const signaturePath = path.join(process.cwd(), "public", "verify", "manifest.sig")
  try {
    return {
      manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest,
      signed: fs.existsSync(signaturePath),
    }
  } catch {
    return { manifest: null, signed: false }
  }
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-heading font-display font-semibold tracking-tight text-fg-strong mt-10 mb-3">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[68ch] text-body text-fg leading-6 sm:leading-7 mb-3">{children}</p>
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="break-all rounded bg-black/[0.05] px-1 py-0.5 font-mono text-small text-fg-strong dark:bg-white/[0.08]">
      {children}
    </code>
  )
}

function Command({ label, children }: { label: string; children: string }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-caption font-sans font-medium uppercase tracking-wide text-fg-muted">{label}</span>
        <CopyButton text={children} label="Copy command" copiedLabel="Copied" className="text-fg-muted hover:text-fg-strong" />
      </div>
      <pre className="max-w-full overflow-x-auto rounded-lg border border-black/[0.08] bg-black/[0.03] p-4 font-mono text-small leading-6 text-fg-strong dark:border-white/10 dark:bg-white/[0.04]">
        <code>{children}</code>
      </pre>
    </div>
  )
}

const ONE_COMMAND = "node scripts/verify-snapshot.mjs"

export default function VerifyPage() {
  const { manifest, signed } = readArtifacts()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${SITE_URL}/verify#article`,
    headline: "Verify the ModelRegistry snapshot",
    description:
      "How to check the published SHA-256 manifest and Ed25519 signature behind the ModelRegistry dataset, offline, without trusting the site.",
    url: `${SITE_URL}/verify`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "en",
    ...(manifest ? { dateModified: manifest.revisedAt } : {}),
  }

  return (
    <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Registry", path: "/" },
              { name: "Verify the snapshot", path: "/verify" },
            ]),
          ),
        }}
      />
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-2">
          Verify the snapshot
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          {manifest ? (
            <>
              <span>Dataset {manifest.datasetVersion}</span>
              <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
              <span>{signed ? "Ed25519 signed" : "Unsigned snapshot"}</span>
              <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
            </>
          ) : null}
          <Link href="/trust" className="text-accent-ink hover:underline underline-offset-2">
            Trust and scope
          </Link>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">
            Methodology
          </Link>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <Link href="/docs" className="text-accent-ink hover:underline underline-offset-2">
            API and docs
          </Link>
        </p>

        {!manifest ? (
          <P>
            No snapshot manifest has been generated for this deployment, so there is nothing here to
            check. The published artifacts and the verification commands appear here as soon as one is
            signed.
          </P>
        ) : (
          <>
            <P>
              The registry publishes a SHA-256 hash of every dataset file and signs the snapshot root
              with Ed25519. Anyone can check that the numbers on this site are the numbers in the
              published files, without trusting the site to tell the truth about itself.
            </P>

            <div className="mb-6 overflow-x-auto">
              <table className="w-full border-collapse text-body">
                <caption className="sr-only">Current snapshot identifiers published by ModelRegistry</caption>
                <tbody>
                  {[
                    ["Dataset version", `${manifest.datasetVersion} (${manifest.recordCount} records)`],
                    ["Revised", manifest.revisedAt],
                    ["Snapshot format", `${manifest.snapshotVersion}, schema ${manifest.schemaVersion}`],
                    ["Files hashed", String(manifest.files.length)],
                    ["Canonical dataset SHA-256", manifest.canonicalDataset.sha256],
                    ["ModelRegistry Score SHA-256", manifest.scores.sha256],
                    ["Snapshot root SHA-256", manifest.rootSha256],
                    ["Signature", signed ? "Ed25519, detached (manifest.sig)" : "Unsigned"],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-black/[0.08] align-top dark:border-white/10">
                      <th
                        scope="row"
                        className="w-[38%] py-2 pr-4 text-left font-sans text-small font-medium text-fg-muted"
                      >
                        {label}
                      </th>
                      <td className="py-2 font-mono text-small text-fg-strong">
                        {label.endsWith("SHA-256") ? <Mono>{value}</Mono> : value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <P>
              The manifest is generated from the dataset revision date, not from a build clock, so the
              same data always produces the same bytes. Change one byte anywhere and both the file hash
              and the root hash change.
            </P>

            <H2>Verify in one command</H2>
            <P>
              From a clone of the repository, with no dependencies installed and no network access:
            </P>
            <Command label="Offline check">{ONE_COMMAND}</Command>
            <P>
              It re-hashes every file the manifest lists, recomputes the root from the manifest body,
              and checks the signature against the published public key. Exit code 0 means every check
              passed.
            </P>

            <H2>Verify without this codebase</H2>
            <P>
              The manifest is plain JSON and the signature is detached Base64, so standard tools are
              enough. Download the three published files, then:
            </P>
            <Command
              label="With standard tools"
            >{`# 1. each file hash must match manifest.json -> files[].sha256
sha256sum data/models.ts

# 2. the root is SHA-256 over the canonical JSON of the manifest
#    with the "rootSha256" key removed (keys sorted, no whitespace)

# 3. the signature covers the root hash as UTF-8 text, with no trailing newline
printf %s "${manifest.rootSha256}" > root-sha256.txt
openssl pkeyutl -verify \\
  -pubin -inkey modelregistry-pubkey.pem \\
  -rawin -in root-sha256.txt \\
  -sigfile manifest.sig.raw
# manifest.sig.raw is: base64 -d public/verify/manifest.sig`}</Command>
            <P>
              Published artifacts:{" "}
              <a href="/verify/manifest.json" className="text-accent-ink hover:underline underline-offset-2">
                manifest.json
              </a>
              ,{" "}
              <a href="/verify/manifest.sig" className="text-accent-ink hover:underline underline-offset-2">
                manifest.sig
              </a>
              ,{" "}
              <a
                href="/.well-known/modelregistry-pubkey.pem"
                className="text-accent-ink hover:underline underline-offset-2"
              >
                modelregistry-pubkey.pem
              </a>
              . The schema the records are validated against is{" "}
              <a href="/schema/model-v1.json" className="text-accent-ink hover:underline underline-offset-2">
                /schema/model-v1.json
              </a>
              .
            </P>

            <H2>What this proves, and what it does not</H2>
            <P>
              A valid signature proves the manifest was signed by the holder of the private key and has
              not changed since. The file hashes prove the dataset files are the ones the manifest
              describes. Together they rule out quiet edits to a published record.
            </P>
            <P>
              They do not prove a fact is correct. A model page is only as good as the primary source
              it cites, which is why every record links its sources and its last check date. Verification
              answers &quot;is this the published data&quot;, not &quot;is the published data right&quot;.
            </P>

            <H2>Files covered</H2>
            <div className="mb-6 overflow-x-auto">
              <table className="w-full border-collapse text-body">
                <caption className="sr-only">Files covered by the snapshot manifest, with their SHA-256 hashes</caption>
                <thead>
                  <tr className="border-b border-black/[0.12] text-left dark:border-white/15">
                    <th scope="col" className="py-2 pr-4 font-sans text-small font-medium text-fg-muted">Path</th>
                    <th scope="col" className="py-2 pr-4 font-sans text-small font-medium text-fg-muted">Bytes</th>
                    <th scope="col" className="py-2 font-sans text-small font-medium text-fg-muted">SHA-256</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.files.map((file) => (
                    <tr key={file.path} className="border-b border-black/[0.08] dark:border-white/10">
                      <td className="py-2 pr-4 font-mono text-small text-fg-strong">{file.path}</td>
                      <td className="py-2 pr-4 font-mono text-small text-fg-muted">
                        {file.bytes.toLocaleString("en-US")}
                      </td>
                      <td className="py-2 font-mono text-small text-fg-muted">
                        <span className="break-all">{file.sha256}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
