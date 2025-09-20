import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'

interface CompanyRadarData {
  company_id: number
  company_name: string
  product_innovation: number
  growth_rate: number
  brand_recognition: number
  pricing_strategy: number
  customer_satisfaction: number
  market_share: number
  domains: string[]
}

interface CompanyActivityHeatmapProps {
  onCompanyClick?: (companyId: number) => void
}

const CompanyActivityHeatmap: React.FC<CompanyActivityHeatmapProps> = ({ onCompanyClick }) => {
  const [radarData, setRadarData] = useState<CompanyRadarData[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE = (import.meta as { env: { VITE_API_BASE?: string } }).env.VITE_API_BASE || 'http://localhost:8000'

  useEffect(() => {
    fetchRadarData()
  }, [])

  const fetchRadarData = async () => {
    try {
      const response = await fetch(`${API_BASE}/companies/activity`)
      if (response.ok) {
        const data = await response.json()
        setRadarData(data)
      }
    } catch (error) {
      console.error('Error fetching radar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const transformDataForRadar = () => {
    const categories = [
      { key: 'product_innovation', label: 'Product Innovation' },
      { key: 'market_share', label: 'Market Share' },
      { key: 'pricing_strategy', label: 'Pricing Strategy' },
      { key: 'customer_satisfaction', label: 'Customer Satisfaction' },
      { key: 'brand_recognition', label: 'Brand Recognition' },
      { key: 'growth_rate', label: 'Growth Rate' }
    ]

    return categories.map(category => {
      const dataPoint: any = { category: category.label }
      radarData.forEach(company => {
        dataPoint[company.company_name] = company[category.key as keyof CompanyRadarData]
      })
      return dataPoint
    })
  }

  const getCompanyColors = () => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
    return radarData.slice(0, 6).map((company, index) => ({
      company: company.company_name,
      color: colors[index]
    }))
  }

  const chartData = transformDataForRadar()
  const companyColors = getCompanyColors()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Competitive Positioning Radar
        </CardTitle>
        <CardDescription>
          Multi-dimensional competitive analysis across key business metrics (0-100 scale)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading competitive positioning data...</div>
        ) : radarData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No companies found</div>
        ) : (
          <div className="space-y-6">
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }} 
                    tickCount={6}
                  />
                  {radarData.slice(0, 6).map((company, index) => (
                    <Radar
                      key={company.company_name}
                      name={company.company_name}
                      dataKey={company.company_name}
                      stroke={companyColors[index]?.color}
                      fill={companyColors[index]?.color}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {radarData.slice(0, 6).map((company, index) => (
                <div 
                  key={company.company_id}
                  className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-shadow"
                  onClick={() => onCompanyClick?.(company.company_id)}
                  title={`Click to view ${company.company_name} details`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: companyColors[index]?.color }}
                    />
                    <h3 className="font-medium">{company.company_name}</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Product Innovation:</span>
                      <span className="font-medium">{company.product_innovation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth Rate:</span>
                      <span className="font-medium">{company.growth_rate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brand Recognition:</span>
                      <span className="font-medium">{company.brand_recognition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pricing Strategy:</span>
                      <span className="font-medium">{company.pricing_strategy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Satisfaction:</span>
                      <span className="font-medium">{company.customer_satisfaction}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Share:</span>
                      <span className="font-medium">{company.market_share}</span>
                    </div>
                  </div>
                  
                  {company.domains.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {company.domains[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center text-xs text-gray-500">
              Scores range from 0-100 • Data from last 7 days • Updated in real-time
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CompanyActivityHeatmap
