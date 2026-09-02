import type { ReactNode, CSSProperties } from "react"

interface TextWithBlurProps {
  children: ReactNode
  className?: string
  delay?: number
}

export default function TextWithBlur({ children, className = "", delay = 0 }: TextWithBlurProps) {
  return (
    <div
      className={`relative reveal-in ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
