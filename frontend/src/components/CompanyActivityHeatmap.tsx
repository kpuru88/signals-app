import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, Target, Eye, Clock } from 'lucide-react'

interface CompanyScoreResult {
  company_id: number
  company_name: string
  activity_score: number
  activity_percentile: number
  activity_z_score: number
  impact_score: number
  momentum: number
  confidence: number
  quadrant: string
  explanations: string[]
  sample_links: string[]
}

interface CompanyActivityHeatmapProps {
  onCompanyClick?: (companyId: number) => void
}

const CompanyActivityHeatmap: React.FC<CompanyActivityHeatmapProps> = ({ onCompanyClick }) => {
  const [scoreData, setScoreData] = useState<CompanyScoreResult[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8000'

  useEffect(() => {
    fetchScoreData()
  }, [])

  const fetchScoreData = async () => {
    try {
      const response = await fetch(`${API_BASE}/companies/activity`)
      if (response.ok) {
        const data = await response.json()
        setScoreData(data)
      }
    } catch (error) {
      console.error('Error fetching score data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getQuadrantIcon = (quadrant: string) => {
    switch (quadrant) {
      case 'Leader': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'Emerging Disruptor': return <Target className="h-4 w-4 text-blue-600" />
      case 'Sleeping Giant': return <Eye className="h-4 w-4 text-yellow-600" />
      case 'Niche/Watch': return <Clock className="h-4 w-4 text-gray-600" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'Leader': return 'bg-green-50 border-green-200 text-green-900'
      case 'Emerging Disruptor': return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'Sleeping Giant': return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'Niche/Watch': return 'bg-gray-50 border-gray-200 text-gray-900'
      default: return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const groupByQuadrant = (data: CompanyScoreResult[]) => {
    const quadrants = {
      'Leader': data.filter(c => c.quadrant === 'Leader'),
      'Emerging Disruptor': data.filter(c => c.quadrant === 'Emerging Disruptor'),
      'Sleeping Giant': data.filter(c => c.quadrant === 'Sleeping Giant'),
      'Niche/Watch': data.filter(c => c.quadrant === 'Niche/Watch')
    }
    return quadrants
  }

  const renderCompanyCard = (company: CompanyScoreResult) => (
    <div
      key={company.company_id}
      className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getQuadrantColor(company.quadrant)}`}
      onClick={() => onCompanyClick?.(company.company_id)}
      title={`Click to view ${company.company_name} details`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{company.company_name}</h4>
        {getQuadrantIcon(company.quadrant)}
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Activity:</span>
          <span className="font-medium">{company.activity_percentile.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Impact:</span>
          <span className="font-medium">{company.impact_score.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Confidence:</span>
          <span className="font-medium">{(company.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      {company.explanations.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          <div className="truncate">{company.explanations[0]}</div>
        </div>
      )}
    </div>
  )

  const quadrantData = groupByQuadrant(scoreData)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Competitive Intelligence Matrix
        </CardTitle>
        <CardDescription>
          Advanced scoring with activity percentiles, impact analysis, and strategic quadrants
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading competitive intelligence data...</div>
        ) : scoreData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No companies found</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 h-96">
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Leaders</h3>
                  <span className="text-xs text-green-700">({quadrantData['Leader'].length})</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {quadrantData['Leader'].map(renderCompanyCard)}
                </div>
              </div>

              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Emerging Disruptors</h3>
                  <span className="text-xs text-blue-700">({quadrantData['Emerging Disruptor'].length})</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {quadrantData['Emerging Disruptor'].map(renderCompanyCard)}
                </div>
              </div>

              <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">Sleeping Giants</h3>
                  <span className="text-xs text-yellow-700">({quadrantData['Sleeping Giant'].length})</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {quadrantData['Sleeping Giant'].map(renderCompanyCard)}
                </div>
              </div>

              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Niche/Watch</h3>
                  <span className="text-xs text-gray-700">({quadrantData['Niche/Watch'].length})</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {quadrantData['Niche/Watch'].map(renderCompanyCard)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{quadrantData['Leader'].length}</div>
                <div className="text-xs text-gray-600">Market Leaders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{quadrantData['Emerging Disruptor'].length}</div>
                <div className="text-xs text-gray-600">Emerging Disruptors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{quadrantData['Sleeping Giant'].length}</div>
                <div className="text-xs text-gray-600">Sleeping Giants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{quadrantData['Niche/Watch'].length}</div>
                <div className="text-xs text-gray-600">Niche Players</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CompanyActivityHeatmap
