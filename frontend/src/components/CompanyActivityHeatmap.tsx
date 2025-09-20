import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Activity } from 'lucide-react'

interface CompanyActivity {
  company_id: number
  company_name: string
  activity_score: number
  recent_signals: number
  recent_tearsheets: number
  domains: string[]
}

interface CompanyActivityHeatmapProps {
  onCompanyClick?: (companyId: number) => void
}

const CompanyActivityHeatmap: React.FC<CompanyActivityHeatmapProps> = ({ onCompanyClick }) => {
  const [activityData, setActivityData] = useState<CompanyActivity[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8000'

  useEffect(() => {
    fetchActivityData()
  }, [])

  const fetchActivityData = async () => {
    try {
      const response = await fetch(`${API_BASE}/companies/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivityData(data)
      }
    } catch (error) {
      console.error('Error fetching activity data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityColor = (score: number, maxScore: number) => {
    if (score === 0) return 'bg-gray-100 border-gray-200 text-gray-600'
    const intensity = Math.min(score / Math.max(maxScore, 1), 1)
    if (intensity > 0.7) return 'bg-red-100 border-red-300 text-red-800'
    if (intensity > 0.4) return 'bg-orange-100 border-orange-300 text-orange-800'
    if (intensity > 0.1) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-green-100 border-green-300 text-green-800'
  }

  const maxScore = Math.max(...activityData.map(d => d.activity_score), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Company Activity Heatmap
        </CardTitle>
        <CardDescription>
          Recent activity levels based on signals, tearsheets, and updates (last 7 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading activity data...</div>
        ) : activityData.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No companies found</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activityData.map((company) => (
              <div
                key={company.company_id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getActivityColor(company.activity_score, maxScore)}`}
                onClick={() => onCompanyClick?.(company.company_id)}
              >
                <div className="font-medium text-sm truncate" title={company.company_name}>
                  {company.company_name}
                </div>
                <div className="text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Score: {company.activity_score}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {company.recent_signals}S • {company.recent_tearsheets}T
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CompanyActivityHeatmap
