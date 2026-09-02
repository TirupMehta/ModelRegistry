import { NextRequest } from "next/server"
import { GET as getCli } from "@/app/api/cli/route"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  return getCli(req)
}
