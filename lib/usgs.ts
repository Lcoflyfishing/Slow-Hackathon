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

export async function fetchFlowData(
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
        recentSlice.reduce((s, p) => s + p.value, 0) / recentSlice.length
      const olderAvg =
        olderSlice.reduce((s, p) => s + p.value, 0) / olderSlice.length
      const change = (recentAvg - olderAvg) / olderAvg

      if (change > 0.05) trend = "up"
      else if (change < -0.05) trend = "down"
    }

    // Downsample to ~168 points (1 per hour) for the chart
    const step = Math.max(1, Math.floor(timeSeries.length / 168))
    const downsampled = timeSeries.filter((_, i) => i % step === 0)

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
