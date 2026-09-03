import { ImageResponse } from "next/og"

export const runtime = "edge"

export const size = {
  width: 180,
  height: 180,
}
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0f13",
          borderRadius: "38px",
          border: "4px solid rgba(255, 255, 255, 0.12)",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: "-0.05em",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: "108px",
            fontWeight: 300,
            color: "#ffffff",
          }}
        >
          M
        </span>
        <span
          style={{
            fontSize: "108px",
            fontWeight: 700,
            color: "#ff5d2e",
          }}
        >
          R
        </span>
      </div>
    ),
    {
      ...size,
    }
  )
}
