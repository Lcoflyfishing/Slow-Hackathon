"use client"

import type { DayForecast } from "@/lib/usgs"

function WeatherIcon({ code, size = 32 }: { code: number; size?: number }) {
  // Map weather codes to simple SVG icons matching the LCO style
  const s = size
  const half = s / 2

  // Sun
  if (code <= 1) {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="7" fill="#ED9A38" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180
          const x1 = 16 + Math.cos(rad) * 10
          const y1 = 16 + Math.sin(rad) * 10
          const x2 = 16 + Math.cos(rad) * 13
          const y2 = 16 + Math.sin(rad) * 13
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ED9A38" strokeWidth="2" strokeLinecap="round" />
        })}
      </svg>
    )
  }

  // Partly cloudy
  if (code === 2) {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="12" cy="12" r="5" fill="#ED9A38" />
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180
          return <line key={angle} x1={12 + Math.cos(rad) * 7} y1={12 + Math.sin(rad) * 7} x2={12 + Math.cos(rad) * 9} y2={12 + Math.sin(rad) * 9} stroke="#ED9A38" strokeWidth="1.5" strokeLinecap="round" />
        })}
        <path d="M10 22 Q10 17 15 17 Q15 14 19 14 Q24 14 24 18 Q27 18 27 21 Q27 24 24 24 L12 24 Q9 24 9 22 Z" fill="#C4C4C4" />
      </svg>
    )
  }

  // Overcast
  if (code === 3) {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <path d="M8 20 Q8 15 13 15 Q13 12 17 12 Q22 12 22 16 Q25 16 25 19 Q25 22 22 22 L10 22 Q7 22 7 20 Z" fill="#A0A0A0" />
        <path d="M12 24 Q12 20 16 20 Q16 17 20 17 Q24 17 24 20 Q27 20 27 23 Q27 26 24 26 L14 26 Q11 26 11 24 Z" fill="#C4C4C4" />
      </svg>
    )
  }

  // Fog
  if (code >= 45 && code <= 48) {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <line x1="6" y1="14" x2="26" y2="14" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="18" x2="24" y2="18" stroke="#C4C4C4" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="22" x2="26" y2="22" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  // Rain / Drizzle / Showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <path d="M8 16 Q8 11 13 11 Q13 8 17 8 Q22 8 22 12 Q25 12 25 15 Q25 18 22 18 L10 18 Q7 18 7 16 Z" fill="#A0A0A0" />
        <line x1="12" y1="21" x2="11" y2="25" stroke="#4A90D9" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="17" y1="21" x2="16" y2="25" stroke="#4A90D9" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="21" x2="21" y2="25" stroke="#4A90D9" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  // Snow
  if (code >= 71 && code <= 77) {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <path d="M8 16 Q8 11 13 11 Q13 8 17 8 Q22 8 22 12 Q25 12 25 15 Q25 18 22 18 L10 18 Q7 18 7 16 Z" fill="#A0A0A0" />
        <circle cx="12" cy="23" r="1.5" fill="#B0C4DE" />
        <circle cx="17" cy="22" r="1.5" fill="#B0C4DE" />
        <circle cx="22" cy="24" r="1.5" fill="#B0C4DE" />
      </svg>
    )
  }

  // Thunderstorm
  if (code >= 95) {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <path d="M8 14 Q8 9 13 9 Q13 6 17 6 Q22 6 22 10 Q25 10 25 13 Q25 16 22 16 L10 16 Q7 16 7 14 Z" fill="#707070" />
        <polygon points="16,18 13,24 15,24 14,28 19,22 17,22 18,18" fill="#F5C542" />
      </svg>
    )
  }

  // Default cloud
  return (
    <svg width={s} height={s} viewBox="0 0 32 32">
      <path d="M8 20 Q8 15 13 15 Q13 12 17 12 Q22 12 22 16 Q25 16 25 19 Q25 22 22 22 L10 22 Q7 22 7 20 Z" fill="#C4C4C4" />
    </svg>
  )
}

interface WeatherForecastProps {
  forecast: DayForecast[]
  currentTemp: number
  currentDescription: string
  windSpeed: number
}

export default function WeatherForecast({ forecast, currentTemp, currentDescription, windSpeed }: WeatherForecastProps) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px solid rgba(31,58,60,0.08)",
        padding: "24px",
      }}
    >
      {/* Current conditions header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <p style={{ color: "#1F3A3C", opacity: 0.5, fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Local Weather
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
            <span style={{ color: "#1F3A3C", fontSize: "28px", fontWeight: 500, letterSpacing: "-0.03em" }}>
              {currentTemp}°
            </span>
            <span style={{ color: "#1F3A3C", opacity: 0.5, fontSize: "14px", fontWeight: 300 }}>
              {currentDescription}
            </span>
          </div>
        </div>
        <div style={{ color: "#1F3A3C", opacity: 0.4, fontSize: "12px", fontWeight: 300, textAlign: "right" }}>
          <div>Wind {windSpeed} mph</div>
        </div>
      </div>

      {/* 7-day forecast */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
        {forecast.map((day, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              flex: 1,
              padding: "8px 0",
              borderRadius: "6px",
              backgroundColor: i === 0 ? "rgba(31,58,60,0.03)" : "transparent",
            }}
          >
            <span style={{ color: "#1F3A3C", fontSize: "12px", fontWeight: i === 0 ? 500 : 400 }}>
              {day.day}
            </span>
            <WeatherIcon code={day.weatherCode} size={28} />
            <div style={{ display: "flex", gap: "4px", fontSize: "12px" }}>
              <span style={{ color: "#1F3A3C", fontWeight: 500 }}>{day.high}°</span>
              <span style={{ color: "#1F3A3C", opacity: 0.4 }}>{day.low}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
