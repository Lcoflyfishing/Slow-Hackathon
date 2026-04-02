"use client"

import { useState, useTransition } from "react"
import {
  searchRiverStations,
  getRiverFlowData,
  type RiverStation,
  type RiverFlowResult,
} from "@/lib/actions/river-flows"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, Search, Droplets } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RiverFlowsPage() {
  const [query, setQuery] = useState("")
  const [stations, setStations] = useState<RiverStation[]>([])
  const [flowData, setFlowData] = useState<RiverFlowResult | null>(null)
  const [error, setError] = useState("")
  const [searching, startSearch] = useTransition()
  const [loading, startLoad] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFlowData(null)
    setError("")
    startSearch(async () => {
      const result = await searchRiverStations(query)
      if (result.error) {
        setError(result.error)
        setStations([])
      } else {
        setStations(result.stations ?? [])
      }
    })
  }

  function handleSelectStation(station: RiverStation) {
    setError("")
    startLoad(async () => {
      const result = await getRiverFlowData(station.siteCode)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setFlowData(result.data)
      }
    })
  }

  const chartData = flowData?.timeSeries.map((pt) => ({
    time: new Date(pt.dateTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    }),
    flow: pt.value,
  }))

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FAF4F0" }}>
      {/* Nav */}
      <nav
        className="w-full flex justify-center h-16 border-b"
        style={{ borderColor: "rgba(31,58,60,0.1)" }}
      >
        <div className="w-full max-w-4xl flex justify-between items-center px-5">
          <Link
            href="/"
            className="text-sm font-medium tracking-tight"
            style={{ color: "#1F3A3C" }}
          >
            &larr; Home
          </Link>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4" style={{ color: "#1F3A3C" }} />
            <span
              className="text-sm font-medium tracking-tight"
              style={{ color: "#1F3A3C" }}
            >
              CA River Flows
            </span>
          </div>
        </div>
      </nav>

      <div className="w-full max-w-4xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-3xl font-medium tracking-tight"
            style={{ color: "#1F3A3C", letterSpacing: "-0.045em" }}
          >
            California River Flows
          </h1>
          <p
            className="mt-2 text-sm font-light"
            style={{ color: "#1F3A3C", opacity: 0.6 }}
          >
            Real-time streamflow data from the U.S. Geological Survey
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <Input
            type="text"
            placeholder="Search a river name (e.g. Sacramento, Klamath, Eel)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-11 border bg-white text-sm font-light placeholder:font-light"
            style={{
              borderColor: "rgba(31,58,60,0.2)",
              color: "#1F3A3C",
            }}
          />
          <Button
            type="submit"
            disabled={searching}
            className="h-11 px-5 text-sm font-medium"
            style={{ backgroundColor: "#1F3A3C", color: "#FAF4F0" }}
          >
            <Search className="h-4 w-4 mr-2" />
            {searching ? "Searching…" : "Search"}
          </Button>
        </form>

        {/* Error */}
        {error && (
          <p className="text-sm mb-6" style={{ color: "#ED6438" }}>
            {error}
          </p>
        )}

        {/* Station List */}
        {stations.length > 0 && !flowData && (
          <div className="mb-8">
            <p
              className="text-xs font-medium uppercase tracking-wide mb-3"
              style={{ color: "#1F3A3C", opacity: 0.5 }}
            >
              {stations.length} station{stations.length !== 1 && "s"} found
            </p>
            <div className="space-y-1">
              {stations.map((station) => (
                <button
                  key={station.siteCode}
                  onClick={() => handleSelectStation(station)}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 rounded-md transition-colors text-sm bg-white hover:bg-white/80 border"
                  style={{
                    borderColor: "rgba(31,58,60,0.08)",
                    color: "#1F3A3C",
                  }}
                >
                  <span className="font-medium">{station.siteName}</span>
                  <span
                    className="ml-2 text-xs font-light"
                    style={{ opacity: 0.4 }}
                  >
                    {station.siteCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "rgba(31,58,60,0.2)", borderTopColor: "transparent" }}
            />
            <span
              className="ml-3 text-sm font-light"
              style={{ color: "#1F3A3C", opacity: 0.6 }}
            >
              Loading flow data…
            </span>
          </div>
        )}

        {/* Flow Data */}
        {flowData && !loading && (
          <div>
            {/* Back to results */}
            <button
              onClick={() => setFlowData(null)}
              className="text-xs font-medium mb-6 hover:underline"
              style={{ color: "#1F3A3C", opacity: 0.5 }}
            >
              &larr; Back to results
            </button>

            {/* Station header + current flow */}
            <div className="mb-8">
              <h2
                className="text-xl font-medium tracking-tight"
                style={{ color: "#1F3A3C", letterSpacing: "-0.03em" }}
              >
                {flowData.siteName}
              </h2>
              <p
                className="text-xs font-light mt-1"
                style={{ color: "#1F3A3C", opacity: 0.4 }}
              >
                Station {flowData.siteCode}
              </p>

              <div className="flex items-end gap-3 mt-4">
                <span
                  className="text-4xl font-medium tabular-nums"
                  style={{ color: "#1F3A3C", letterSpacing: "-0.03em" }}
                >
                  {flowData.currentFlow.toLocaleString()}
                </span>
                <span
                  className="text-sm font-light pb-1"
                  style={{ color: "#1F3A3C", opacity: 0.5 }}
                >
                  {flowData.unit}
                </span>
              </div>
              <p
                className="text-xs font-light mt-1"
                style={{ color: "#1F3A3C", opacity: 0.4 }}
              >
                Updated{" "}
                {new Date(flowData.lastUpdated).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Chart + Trend Arrow */}
            <div
              className="rounded-lg border bg-white p-6"
              style={{ borderColor: "rgba(31,58,60,0.08)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "#1F3A3C", opacity: 0.5 }}
                >
                  7-Day Flow
                </p>

                {/* Trend Arrow */}
                <div className="flex items-center gap-1.5">
                  {flowData.trend === "up" && (
                    <>
                      <TrendingUp className="h-4 w-4" style={{ color: "#2D8B5E" }} />
                      <span className="text-xs font-medium" style={{ color: "#2D8B5E" }}>
                        Rising
                      </span>
                    </>
                  )}
                  {flowData.trend === "down" && (
                    <>
                      <TrendingDown className="h-4 w-4" style={{ color: "#ED6438" }} />
                      <span className="text-xs font-medium" style={{ color: "#ED6438" }}>
                        Falling
                      </span>
                    </>
                  )}
                  {flowData.trend === "stable" && (
                    <>
                      <Minus className="h-4 w-4" style={{ color: "#1F3A3C", opacity: 0.4 }} />
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#1F3A3C", opacity: 0.4 }}
                      >
                        Stable
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(31,58,60,0.06)"
                    />
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

            <p
              className="text-xs font-light mt-4 text-center"
              style={{ color: "#1F3A3C", opacity: 0.3 }}
            >
              Data from USGS National Water Information System
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
