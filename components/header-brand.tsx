import Link from "next/link"

// Brand lockup. The homepage now carries a real page headline, so the
// wordmark stays a wordmark everywhere instead of doubling as an h1.
export default function HeaderBrand() {
  return (
    <Link href="/" className="group inline-flex items-end gap-1.5 sm:gap-2 select-none">
      <p className="text-headline font-display font-medium tracking-tight text-black dark:text-white leading-none">
        Model<span className="font-bold text-accent-ink">Registry</span>
      </p>
    </Link>
  )
}
