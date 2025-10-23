'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Stats {
  posts: number
  sessions: number
  clickouts: number
  swaps: number
  volume: number
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-600">Failed to load data</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            XAUH Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Track social media → website → DEX swap conversions
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <KPICard
            title="Posts"
            value={stats.posts}
            subtitle="X + Telegram"
            color="blue"
          />
          <KPICard
            title="Sessions"
            value={stats.sessions}
            subtitle="Website visits"
            color="green"
          />
          <KPICard
            title="Clickouts"
            value={stats.clickouts}
            subtitle="To DEX"
            color="purple"
          />
          <KPICard
            title="Swaps"
            value={stats.swaps}
            subtitle="Completed"
            color="orange"
          />
          <KPICard
            title="Volume"
            value={`$${stats.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtitle="Total USD"
            color="emerald"
          />
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Conversion Funnel</h2>
          <div className="space-y-4">
            <FunnelStep
              label="Sessions → Clickouts"
              percentage={stats.conversionRates.sessionToClickout}
              color="bg-green-500"
            />
            <FunnelStep
              label="Clickouts → Swaps"
              percentage={stats.conversionRates.clickoutToSwap}
              color="bg-purple-500"
            />
            <FunnelStep
              label="End-to-End (Sessions → Swaps)"
              percentage={stats.conversionRates.endToEnd}
              color="bg-orange-500"
            />
          </div>
        </div>

        {/* Time Series Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">30-Day Trends</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sessions" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Sessions"
              />
              <Line 
                type="monotone" 
                dataKey="clickouts" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Clickouts"
              />
              <Line 
                type="monotone" 
                dataKey="swaps" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Swaps"
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
  color 
}: { 
  title: string
  value: number | string
  subtitle: string
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border-2 rounded-lg p-6`}>
      <div className="text-sm font-medium opacity-75 mb-1">{title}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-75">{subtitle}</div>
    </div>
  )
}

function FunnelStep({
  label,
  percentage,
  color,
}: {
  label: string
  percentage: number
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
