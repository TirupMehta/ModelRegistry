import { companies } from "@/data/companies"

/**
 * One mark for every lab: the initial on a tint of the lab's colour. Same shape
 * and size everywhere, so the list never mixes real logos with placeholders.
 */
export default function LabMark({
  companyId,
  size = "md",
  className = "",
}: {
  companyId: string
  size?: "sm" | "md"
  className?: string
}) {
  const company = companies[companyId]
  const color = company?.accentColor ?? "#888888"
  const initial = (company?.shortName ?? companyId).trim().charAt(0).toUpperCase()
  const box = size === "sm" ? "h-6 w-6 rounded-md text-caption" : "h-8 w-8 rounded-lg text-small"
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center font-display font-semibold text-fg-strong ${box} ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      {initial}
    </span>
  )
}
