export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          XAUH Analytics Dashboard
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Track social media → website → DEX swap conversions
        </p>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">✅ Project Setup Complete!</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Next.js 14 installed</li>
            <li>✓ TypeScript configured</li>
            <li>✓ Tailwind CSS ready</li>
            <li>✓ Prisma installed</li>
            <li>✓ Recharts ready for charts</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Next step: Set up the database!
          </p>
        </div>
      </div>
    </main>
  )
}
