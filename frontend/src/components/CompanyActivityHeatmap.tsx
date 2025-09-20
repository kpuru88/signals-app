import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

interface CompanyActivity {
  company_id: number
  company_name: string
  product_updates: number
  pricing_changes: number
  news_articles: number
  funding_news: number
  total_score: number
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

  const getScoreColor = (score: number) => {
    if (score === 0) return 'bg-gray-100 text-gray-600'
    if (score === 1) return 'bg-red-100 text-red-800'
    if (score === 2) return 'bg-orange-100 text-orange-800'
    if (score === 3) return 'bg-yellow-100 text-yellow-800'
    if (score === 4) return 'bg-lime-100 text-lime-800'
    if (score === 5) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-600'
  }

  const metrics = [
    { key: 'product_updates', label: 'Product Updates' },
    { key: 'pricing_changes', label: 'Pricing Changes' },
    { key: 'news_articles', label: 'News Articles' },
    { key: 'funding_news', label: 'Funding News' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Competitor Activity Matrix
        </CardTitle>
        <CardDescription>
          Recent activity levels across key metrics (last 7 days) - Scale 1-5
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading activity data...</div>
        ) : activityData.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No companies found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-700 text-white">
                  <th className="p-3 text-left font-medium border border-slate-600">
                    Activity Metrics
                  </th>
                  {activityData.map((company) => (
                    <th 
                      key={company.company_id} 
                      className="p-3 text-center font-medium border border-slate-600 cursor-pointer hover:bg-slate-600"
                      onClick={() => onCompanyClick?.(company.company_id)}
                      title={`Click to view ${company.company_name} details`}
                    >
                      <div className="text-sm">{company.company_name}</div>
                      <div className="text-xs text-slate-300 mt-1">
                        (Rank performance on a scale of 1-5)
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => (
                  <tr key={metric.key} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="p-3 font-medium text-slate-700 border border-slate-200 bg-slate-100">
                      <div>{metric.label}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Describe this attribute and/or its importance.
                      </div>
                    </td>
                    {activityData.map((company) => (
                      <td 
                        key={`${company.company_id}-${metric.key}`}
                        className="p-3 text-center border border-slate-200"
                      >
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${getScoreColor(company[metric.key as keyof CompanyActivity] as number)}`}>
                          {company[metric.key as keyof CompanyActivity] as number}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-slate-700 text-white font-bold">
                  <td className="p-3 border border-slate-600">Total</td>
                  {activityData.map((company) => (
                    <td key={`${company.company_id}-total`} className="p-3 text-center border border-slate-600">
                      {company.total_score}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CompanyActivityHeatmap
