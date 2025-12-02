'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Stats {
  posts: number
  sessions: number
  clickouts: number
  swaps: number
  volumeUsd: number
  volumeCoins: number
  sessionsByWebsite: Record<string, number>
  conversionRates: {
    sessionToClickout: number
    clickoutToSwap: number
    endToEnd: number
  }
}

interface TimeseriesData {
  date: string
  posts: number
  sessions: number
  clickouts: number
  swaps: number
  volume: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [timeseries, setTimeseries] = useState<TimeseriesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, timeseriesRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/timeseries'),
        ])

        const statsData = await statsRes.json()
        const timeseriesData = await timeseriesRes.json()

        setStats(statsData)
        setTimeseries(timeseriesData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a1628' }}>
        <div className="text-xl" style={{ color: '#d4af37' }}>Loading dashboard...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a1628' }}>
        <div className="text-xl text-red-400">Failed to load data</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0f1e33' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#d4af37' }}>
              Herculis Gold Coin Analytics
            </h1>
            <img
              src="/logo_whitebk.png"
              alt="Herculis Logo"
              className="h-12 w-auto"
            />
          </div>
          <div>
            <p className="text-lg" style={{ color: '#b8965f' }}>
              Track social media → website → DEX swap conversions
            </p>
          </div>
          <div>
            <a
              href="/clickouts"
              className="px-4 py-2 rounded font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#d4af37', color: '#0a1628' }}
            >
              View Clickouts by Website →
            </a>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <KPICard
            title="Posts"
            value={stats.posts}
            subtitle="X + Telegram"
            variant="primary"
          />
          <SessionsCard
            total={stats.sessions}
            breakdown={stats.sessionsByWebsite}
          />
          <KPICard
            title="Clickouts"
            value={stats.clickouts}
            subtitle="To DEX"
            variant="accent"
          />
          <KPICard
            title="Swaps"
            value={stats.swaps}
            subtitle="Completed"
            variant="highlight"
          />
          <VolumeCard
            usd={stats.volumeUsd}
            coins={stats.volumeCoins}
          />
        </div>

        {/* Conversion Funnel */}
        <div className="rounded-lg shadow-lg p-6 mb-8" style={{ backgroundColor: '#1a2942' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#d4af37' }}>
            Conversion Funnel
          </h2>
          <div className="space-y-4">
            <FunnelStep
              label="Sessions → Clickouts"
              percentage={stats.conversionRates.sessionToClickout}
            />
            <FunnelStep
              label="Clickouts → Swaps"
              percentage={stats.conversionRates.clickoutToSwap}
            />
            <FunnelStep
              label="End-to-End (Sessions → Swaps)"
              percentage={stats.conversionRates.endToEnd}
            />
          </div>
        </div>

        {/* Time Series Chart */}
        <div className="rounded-lg shadow-lg p-6" style={{ backgroundColor: '#1a2942' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#d4af37' }}>
            30-Day Trends
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#b8965f' }}
                stroke="#b8965f"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#b8965f' }} stroke="#b8965f" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a2942', 
                  border: '1px solid #d4af37',
                  borderRadius: '8px',
                  color: '#d4af37'
                }}
              />
              <Legend wrapperStyle={{ color: '#d4af37' }} />
              <Line 
                type="monotone" 
                dataKey="sessions" 
                stroke="#d4af37" 
                strokeWidth={2}
                name="Sessions"
                dot={{ fill: '#d4af37' }}
              />
              <Line 
                type="monotone" 
                dataKey="clickouts" 
                stroke="#b8965f" 
                strokeWidth={2}
                name="Clickouts"
                dot={{ fill: '#b8965f' }}
              />
              <Line 
                type="monotone" 
                dataKey="swaps" 
                stroke="#8b7355" 
                strokeWidth={2}
                name="Swaps"
                dot={{ fill: '#8b7355' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  variant 
}: { 
  title: string
  value: number | string
  subtitle: string
  variant: 'primary' | 'secondary' | 'accent' | 'highlight' | 'gold'
}) {
  const variants = {
    primary: {
      bg: '#1a2942',
      border: '#2a4a7c',
      text: '#d4af37'
    },
    secondary: {
      bg: '#1a2942',
      border: '#2a4a7c',
      text: '#b8965f'
    },
    accent: {
      bg: '#1a2942',
      border: '#d4af37',
      text: '#d4af37'
    },
    highlight: {
      bg: '#1a2942',
      border: '#b8965f',
      text: '#d4af37'
    },
    gold: {
      bg: '#2a3f5f',
      border: '#d4af37',
      text: '#d4af37'
    }
  }

  const colors = variants[variant]

  return (
    <div 
      className="border-2 rounded-lg p-6"
      style={{ 
        backgroundColor: colors.bg, 
        borderColor: colors.border 
      }}
    >
      <div className="text-sm font-medium opacity-75 mb-1" style={{ color: colors.text }}>
        {title}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: colors.text }}>
        {value}
      </div>
      <div className="text-xs opacity-75" style={{ color: colors.text }}>
        {subtitle}
      </div>
    </div>
  )
}

function SessionsCard({ 
  total, 
  breakdown 
}: { 
  total: number
  breakdown: Record<string, number>
}) {
  return (
    <div 
      className="border-2 rounded-lg p-6"
      style={{ 
        backgroundColor: '#1a2942', 
        borderColor: '#2a4a7c' 
      }}
    >
      <div className="text-sm font-medium opacity-75 mb-1" style={{ color: '#b8965f' }}>
        Sessions
      </div>
      <div className="text-3xl font-bold mb-2" style={{ color: '#b8965f' }}>
        {total}
      </div>
      <div className="text-xs space-y-1" style={{ color: '#b8965f' }}>
        {Object.entries(breakdown).map(([site, count]) => (
          <div key={site} className="flex justify-between">
            <span className="opacity-75">{site}:</span>
            <span className="font-semibold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VolumeCard({ 
  usd, 
  coins 
}: { 
  usd: number
  coins: number
}) {
  return (
    <div 
      className="border-2 rounded-lg p-6"
      style={{ 
        backgroundColor: '#2a3f5f', 
        borderColor: '#d4af37' 
      }}
    >
      <div className="text-sm font-medium opacity-75 mb-1" style={{ color: '#d4af37' }}>
        Volume (Cumulative)
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: '#d4af37' }}>
        ${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <div className="text-lg font-semibold" style={{ color: '#b8965f' }}>
        {coins.toLocaleString(undefined, { maximumFractionDigits: 2 })} XAUH
      </div>
      <div className="text-xs opacity-60 mt-1" style={{ color: '#b8965f' }}>
        Total traded over time
      </div>
    </div>
  )
}

function FunnelStep({
  label,
  percentage,
}: {
  label: string
  percentage: number
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium" style={{ color: '#b8965f' }}>
          {label}
        </span>
        <span className="text-sm font-bold" style={{ color: '#d4af37' }}>
          {percentage}%
        </span>
      </div>
      <div className="w-full rounded-full h-4 overflow-hidden" style={{ backgroundColor: '#0f1e33' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            background: 'linear-gradient(90deg, #d4af37 0%, #b8965f 100%)'
          }}
        />
      </div>
    </div>
  )
}
