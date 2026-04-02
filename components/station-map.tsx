"use client"

import dynamic from "next/dynamic"

const MapInner = dynamic(() => import("./station-map-inner"), { ssr: false })

interface StationMapProps {
  latitude: number
  longitude: number
  siteName: string
}

export default function StationMap(props: StationMapProps) {
  return <MapInner {...props} />
}
