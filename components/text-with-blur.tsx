import type { ReactNode, CSSProperties } from "react"

interface TextWithBlurProps {
  children: ReactNode
  className?: string
  delay?: number
}

export default function TextWithBlur({ children, className = "" }: TextWithBlurProps) {
  return <div className={className}>{children}</div>
}
