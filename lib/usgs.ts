export interface FlowDataPoint {
  dateTime: string
  value: number
}

export interface DayForecast {
  day: string // e.g. "Thu"
  high: number
  low: number
  weatherCode: number
  description: string
}

export interface WeatherData {
  temperature: number
  description: string
  windSpeed: number
  precipitation: number
  forecast: DayForecast[]
}

export interface RiverFlowResult {
  siteName: string
  siteCode: string
  currentFlow: number
  unit: string
  lastUpdated: string
  timeSeries: FlowDataPoint[]
  trend: "up" | "down" | "stable"
  rateOfChange: number // cfs per hour
  latitude: number
  longitude: number
  weather?: WeatherData
}

const weatherCodeMap: Record<number, string> = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Freezing Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Light Showers",
  81: "Showers",
  82: "Heavy Showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ Hail",
  99: "Heavy Thunderstorm",
}

export async function fetchWeather(
  lat: number,
  lng: number
): Promise<WeatherData | undefined> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=7`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return undefined

    const data = await res.json()
    const current = data?.current
    const daily = data?.daily
    if (!current) return undefined

    const forecast: DayForecast[] = []
    if (daily?.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i] + "T12:00:00")
        forecast.push({
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          high: Math.round(daily.temperature_2m_max[i]),
          low: Math.round(daily.temperature_2m_min[i]),
          weatherCode: daily.weather_code[i],
          description: weatherCodeMap[daily.weather_code[i]] ?? "Unknown",
        })
      }
    }

    return {
      temperature: Math.round(current.temperature_2m),
      description: weatherCodeMap[current.weather_code] ?? "Unknown",
      windSpeed: Math.round(current.wind_speed_10m),
      precipitation: current.precipitation,
      forecast,
    }
  } catch {
    return undefined
  }
}

export type FlowPeriod = "1" | "3" | "7" | "30"

export async function fetchFlowData(
  siteCode: string,
  days: FlowPeriod = "7"
): Promise<{ data?: RiverFlowResult; error?: string }> {
  try {
    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${encodeURIComponent(siteCode)}&parameterCd=00060&period=P${days}D`

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
    const latitude = site.geoLocation.geogLocation.latitude
    const longitude = site.geoLocation.geogLocation.longitude

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
    const recentSlice = timeSeries.slice(-48)
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

    // Calculate rate of change (cfs/hr) using last ~6 hours of data
    let rateOfChange = 0
    if (timeSeries.length >= 24) {
      const recent = timeSeries[timeSeries.length - 1]
      const earlier = timeSeries[timeSeries.length - 24] // ~6 hours ago at 15-min intervals
      const hoursDiff =
        (new Date(recent.dateTime).getTime() - new Date(earlier.dateTime).getTime()) /
        (1000 * 60 * 60)
      if (hoursDiff > 0) {
        rateOfChange = Math.round(((recent.value - earlier.value) / hoursDiff) * 10) / 10
      }
    }

    // Downsample to ~168 points (1 per hour) for the chart
    const step = Math.max(1, Math.floor(timeSeries.length / 168))
    const downsampled = timeSeries.filter((_, i) => i % step === 0)

    // Fetch weather in parallel
    const weather = await fetchWeather(latitude, longitude)

    return {
      data: {
        siteName: site.siteName,
        siteCode: site.siteCode[0].value,
        currentFlow,
        unit,
        lastUpdated,
        timeSeries: downsampled,
        trend,
        rateOfChange,
        latitude,
        longitude,
        weather,
      },
    }
  } catch {
    return { error: "Unable to reach USGS. Please try again." }
  }
}
