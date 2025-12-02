'use client'

import { useEffect, useState } from 'react'

interface ClickoutData {
  total: number
  byWebsite: Record<string, number>
  recentClickouts: Array<{
    id: string
    website: string
    dest: string
    utm: {
      source: string | null
      medium: string | null
      campaign: string | null
    }
    createdAt: string
  }>
}

export default function ClickoutsPage() {
  const [data, setData] = useState<ClickoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    fetch('/api/clickouts-by-website')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching clickouts:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-red-600">Error loading clickouts</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:underline">← Back to Dashboard</a>
        </div>

        <h1 className="text-3xl font-bold mb-8">DEX Clickouts by Website</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Total Clickouts: {data.total}</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(data.byWebsite).map(([website, count]) => (
              <div key={website} className="bg-gray-50 rounded p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600 mt-1">{website}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold">All Clickouts ({data.recentClickouts.length})</h2>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(data.recentClickouts.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(data.recentClickouts.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(data.recentClickouts.length / itemsPerPage)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                Next
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTM Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTM Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentClickouts
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((clickout) => (
                  <tr key={clickout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        clickout.website.includes('xauh.gold') ? 'bg-blue-100 text-blue-800' :
                        clickout.website.includes('herculis.gold') ? 'bg-green-100 text-green-800' :
                        clickout.website.includes('herculis.li') ? 'bg-purple-100 text-purple-800' :
                        clickout.website.includes('herculis.ch') ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {clickout.website}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <a href={clickout.dest} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {clickout.dest}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clickout.utm.source || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clickout.utm.campaign || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(clickout.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
