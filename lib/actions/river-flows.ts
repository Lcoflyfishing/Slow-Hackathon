"use server"

export interface RiverStation {
  siteCode: string
  siteName: string
  latitude: number
  longitude: number
}

export interface FlowDataPoint {
  dateTime: string
  value: number
}

export interface RiverFlowResult {
  siteName: string
  siteCode: string
  currentFlow: number
  unit: string
  lastUpdated: string
  timeSeries: FlowDataPoint[]
  trend: "up" | "down" | "stable"
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

export async function getRiverFlowData(
  siteCode: string
): Promise<{ data?: RiverFlowResult; error?: string }> {
  try {
    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${encodeURIComponent(siteCode)}&parameterCd=00060&period=P7D`

    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) {
      return { error: "Failed to fetch flow data from USGS" }
    }

    const data = await res.json()
    const ts = data?.value?.timeSeries?.[0]

    if (!ts) {
      return { error: "No flow data available for this station" }
    }

    const site = ts.sourceInfo
    const values = ts.values[0].value
    const unit = ts.variable.unit.unitCode

    const timeSeries: FlowDataPoint[] = values
      .filter((v: { value: string }) => v.value !== "-999999")
      .map((v: { dateTime: string; value: string }) => ({
        dateTime: v.dateTime,
        value: parseFloat(v.value),
      }))

    if (timeSeries.length === 0) {
      return { error: "No valid flow measurements available" }
    }

    const currentFlow = timeSeries[timeSeries.length - 1].value
    const lastUpdated = timeSeries[timeSeries.length - 1].dateTime

    // Calculate trend: compare last 12 hours average vs previous 12 hours
    const recentSlice = timeSeries.slice(-48) // ~12 hours at 15-min intervals
    const olderSlice = timeSeries.slice(-96, -48)

    let trend: "up" | "down" | "stable" = "stable"
    if (recentSlice.length > 0 && olderSlice.length > 0) {
      const recentAvg =
        recentSlice.reduce((s: number, p: FlowDataPoint) => s + p.value, 0) /
        recentSlice.length
      const olderAvg =
        olderSlice.reduce((s: number, p: FlowDataPoint) => s + p.value, 0) /
        olderSlice.length
      const change = (recentAvg - olderAvg) / olderAvg

      if (change > 0.05) trend = "up"
      else if (change < -0.05) trend = "down"
    }

    // Downsample to ~168 points (1 per hour) for the chart
    const step = Math.max(1, Math.floor(timeSeries.length / 168))
    const downsampled = timeSeries.filter(
      (_: FlowDataPoint, i: number) => i % step === 0
    )

    return {
      data: {
        siteName: site.siteName,
        siteCode: site.siteCode[0].value,
        currentFlow,
        unit,
        lastUpdated,
        timeSeries: downsampled,
        trend,
      },
    }
  } catch {
    return { error: "Unable to reach USGS. Please try again." }
  }
}
