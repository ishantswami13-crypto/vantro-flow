"use client"
import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<any>(null)
  const phiRef = useRef(0)

  useEffect(() => {
    if (!canvasRef.current) return

    globeRef.current = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0.2,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.1],
      markerColor: [0.1, 0.8, 0.7],
      glowColor: [0.1, 0.6, 0.5],
      markers: [
        { location: [28.67, 77.45], size: 0.08 },  // Ghaziabad (home)
        { location: [28.61, 77.20], size: 0.06 },  // Delhi
        { location: [19.08, 72.88], size: 0.06 },  // Mumbai
        { location: [12.97, 77.59], size: 0.05 },  // Bangalore
        { location: [22.57, 88.36], size: 0.04 },  // Kolkata
        { location: [13.08, 80.27], size: 0.04 },  // Chennai
        { location: [17.38, 78.48], size: 0.04 },  // Hyderabad
        { location: [23.03, 72.58], size: 0.04 },  // Ahmedabad
        { location: [18.52, 73.86], size: 0.04 },  // Pune
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onRender: (state: any) => {
        state.phi = phiRef.current
        phiRef.current += 0.003
      }
    } as any)

    return () => {
      globeRef.current?.destroy()
    }
  }, [])

  return (
    <div style={{
      width: 500,
      height: 500,
      flexShrink: 0,
      position: 'relative',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: 500,
          height: 500,
          cursor: 'grab',
        }}
      />
    </div>
  )
}
