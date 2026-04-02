import { NextRequest, NextResponse } from "next/server"
import { fetchFlowData, type FlowPeriod } from "@/lib/usgs"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ siteCode: string }> }
) {
  const { siteCode } = await params

  if (!siteCode || !/^\d+$/.test(siteCode)) {
    return NextResponse.json(
      { error: "Invalid site code" },
      { status: 400, headers: corsHeaders }
    )
  }

  const validDays: FlowPeriod[] = ["1", "3", "7", "30"]
  const daysParam = _request.nextUrl.searchParams.get("days") as FlowPeriod | null
  const days: FlowPeriod = daysParam && validDays.includes(daysParam) ? daysParam : "7"

  const result = await fetchFlowData(siteCode, days)

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 404, headers: corsHeaders }
    )
  }

  return NextResponse.json(result.data, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  })
}
