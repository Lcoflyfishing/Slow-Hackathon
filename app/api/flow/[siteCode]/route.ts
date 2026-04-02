import { NextRequest, NextResponse } from "next/server"
import { fetchFlowData } from "@/lib/usgs"

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

  const result = await fetchFlowData(siteCode)

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
