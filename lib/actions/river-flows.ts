"use server"

export type { FlowDataPoint, RiverFlowResult } from "@/lib/usgs"

export interface RiverStation {
  siteCode: string
  siteName: string
  latitude: number
  longitude: number
}

export async function searchRiverStations(
  query: string
): Promise<{ stations?: RiverStation[]; error?: string }> {
  if (!query || query.trim().length < 2) {
    return { error: "Please enter at least 2 characters" }
  }

  try {
    // Use USGS Site Service (rdb format) — the IV service doesn't support name filtering
    const url = `https://waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=CA&parameterCd=00060&siteStatus=active&siteType=ST&hasDataTypeCd=iv`

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return { error: "Failed to fetch stations from USGS" }
    }

    const text = await res.text()
    const lines = text.split("\n")

    // Parse tab-delimited data, skipping comment lines (#) and the header format line
    const searchLower = query.trim().toLowerCase()
    const stations: RiverStation[] = []
    let headerParsed = false
    let colMap: Record<string, number> = {}

    for (const line of lines) {
      if (line.startsWith("#") || line.trim() === "") continue

      const cols = line.split("\t")

      // First non-comment line is the header
      if (!headerParsed) {
        cols.forEach((col, i) => { colMap[col.trim()] = i })
        headerParsed = true
        continue
      }

      // Second non-comment line is the format spec (e.g. "5s\t15s\t...")
      if (cols[0]?.match(/^\d+[sd]$/)) continue

      const siteName = cols[colMap["station_nm"]] ?? ""
      const siteCode = cols[colMap["site_no"]] ?? ""
      const lat = parseFloat(cols[colMap["dec_lat_va"]] ?? "")
      const lng = parseFloat(cols[colMap["dec_long_va"]] ?? "")

      if (siteName.toLowerCase().includes(searchLower)) {
        stations.push({
          siteCode,
          siteName,
          latitude: lat,
          longitude: lng,
        })
      }

      if (stations.length >= 20) break
    }

    if (stations.length === 0) {
      return { error: `No stations found for "${query}" in California` }
    }

    return { stations }
  } catch {
    return { error: "Unable to reach USGS. Please try again." }
  }
}

import { fetchFlowData } from "@/lib/usgs"
import type { RiverFlowResult, FlowPeriod } from "@/lib/usgs"

export type { FlowPeriod } from "@/lib/usgs"

export async function getRiverFlowData(
  siteCode: string,
  days: FlowPeriod = "7"
): Promise<{ data?: RiverFlowResult; error?: string }> {
  return fetchFlowData(siteCode, days)
}
