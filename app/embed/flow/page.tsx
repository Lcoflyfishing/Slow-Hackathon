"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import type { RiverFlowResult } from "@/lib/usgs"
import StationMap from "@/components/station-map"
import WeatherForecast from "@/components/weather-forecast"

export default function EmbedFlowPage() {
  return (
    <Suspense fallback={<div style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#FAF4F0", padding: "24px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#1F3A3C", opacity: 0.6, fontSize: "14px" }}>Loading...</span></div>}>
      <EmbedFlowContent />
    </Suspense>
  )
}

function EmbedFlowContent() {
  const searchParams = useSearchParams()
  const siteCode = searchParams.get("site")
  const [flowData, setFlowData] = useState<RiverFlowResult | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"1" | "3" | "7" | "30">("7")

  useEffect(() => {
    if (!siteCode) {
      setError("No site code provided. Add ?site=XXXXXXXX to the URL.")
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/flow/${siteCode}?days=${period}`)
        if (!res.ok) {
          const body = await res.json()
          setError(body.error || "Failed to load flow data")
        } else {
          setFlowData(await res.json())
        }
      } catch {
        setError("Unable to load flow data")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [siteCode, period])

  const chartData = flowData?.timeSeries.map((pt) => ({
    time: new Date(pt.dateTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    }),
    flow: pt.value,
  }))

  // Trend arrow SVGs (inline to avoid external dependencies in embed)
  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D8B5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      )
    }
    if (trend === "down") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ED6438" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
          <polyline points="16 17 22 17 22 11" />
        </svg>
      )
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(31,58,60,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )
  }

  const trendLabel = flowData?.trend === "up" ? "Rising" : flowData?.trend === "down" ? "Falling" : "Stable"
  const trendColor = flowData?.trend === "up" ? "#2D8B5E" : flowData?.trend === "down" ? "#ED6438" : "rgba(31,58,60,0.4)"

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#FAF4F0", padding: "24px", minHeight: "100vh" }}>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <span style={{ color: "#1F3A3C", opacity: 0.6, fontSize: "14px", fontWeight: 300 }}>
            Loading flow data...
          </span>
        </div>
      )}

      {error && (
        <p style={{ color: "#ED6438", fontSize: "14px" }}>{error}</p>
      )}

      {flowData && !loading && (
        <div>
          {/* Station header + current flow */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ color: "#1F3A3C", fontSize: "20px", fontWeight: 500, letterSpacing: "-0.03em", margin: 0 }}>
              {flowData.siteName}
            </h2>
            <p style={{ color: "#1F3A3C", opacity: 0.4, fontSize: "12px", fontWeight: 300, margin: "4px 0 0" }}>
              Station {flowData.siteCode}
            </p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginTop: "16px" }}>
              <span style={{ color: "#1F3A3C", fontSize: "36px", fontWeight: 500, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                {flowData.currentFlow.toLocaleString()}
              </span>
              <span style={{ color: "#1F3A3C", opacity: 0.5, fontSize: "14px", fontWeight: 300, paddingBottom: "4px" }}>
                {flowData.unit}
              </span>
            </div>
            <p style={{ color: "#1F3A3C", opacity: 0.4, fontSize: "12px", fontWeight: 300, margin: "4px 0 0" }}>
              Updated{" "}
              {new Date(flowData.lastUpdated).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Chart */}
          <div style={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid rgba(31,58,60,0.08)", padding: "24px" }}>
            {/* Period Toggle */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
              {(["1", "3", "7", "30"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriod(d)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: period === d ? "#1F3A3C" : "transparent",
                    color: period === d ? "#FAF4F0" : "#1F3A3C",
                    opacity: period === d ? 1 : 0.4,
                  }}
                >
                  {d}D
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <p style={{ color: "#1F3A3C", opacity: 0.5, fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                {period}-Day Flow
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendIcon trend={flowData.trend} />
                <span style={{ color: trendColor, fontSize: "12px", fontWeight: 500 }}>
                  {trendLabel}
                </span>
                <span style={{ color: trendColor, fontSize: "12px", fontWeight: 300 }}>
                  {flowData.rateOfChange > 0 ? "+" : ""}{flowData.rateOfChange} cfs/hr
                </span>
              </div>
            </div>

            <div style={{ height: "256px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,58,60,0.06)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11, fill: "rgba(31,58,60,0.4)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(31,58,60,0.4)" }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tickFormatter={(v: number) => v.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F3A3C",
                      border: "none",
                      borderRadius: "6px",
                      color: "#FAF4F0",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "rgba(250,244,240,0.6)", fontSize: "11px" }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} ${flowData.unit}`,
                      "Flow",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="flow"
                    stroke="#1F3A3C"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: "#1F3A3C" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weather Forecast */}
          {flowData.weather && flowData.weather.forecast && flowData.weather.forecast.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <WeatherForecast
                forecast={flowData.weather.forecast}
                currentTemp={flowData.weather.temperature}
                currentDescription={flowData.weather.description}
                windSpeed={flowData.weather.windSpeed}
              />
            </div>
          )}

          {/* Map */}
          {flowData.latitude && flowData.longitude && (
            <div style={{ marginTop: "24px" }}>
              <p style={{ color: "#1F3A3C", opacity: 0.5, fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                Station Location
              </p>
              <StationMap
                latitude={flowData.latitude}
                longitude={flowData.longitude}
                siteName={flowData.siteName}
              />
            </div>
          )}

          <p style={{ color: "#1F3A3C", opacity: 0.3, fontSize: "12px", fontWeight: 300, textAlign: "center", marginTop: "16px" }}>
            Data from USGS National Water Information System
          </p>
        </div>
      )}
    </div>
  )
}
