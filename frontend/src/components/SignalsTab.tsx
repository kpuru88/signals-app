import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  TrendingUp, 
  FileText, 
  Shield, 
  DollarSign, 
  Users,
  ExternalLink,
  Clock
} from 'lucide-react'

interface Signal {
  id: number
  company_id: number
  type: string
  title: string
  summary: string
  severity: string
  confidence: number
  urls: string[]
  created_at: string
}

const SignalsTab = () => {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

  useEffect(() => {
    fetchSignals()
  }, [])

  const fetchSignals = async () => {
    setLoading(true)
    console.log('DEBUG: Starting fetchSignals, API_BASE:', API_BASE)
    try {
      // First get all companies to detect signals for
      console.log('DEBUG: Fetching companies from:', `${API_BASE}/vendors`)
      const companiesResponse = await fetch(`${API_BASE}/vendors`)
      console.log('DEBUG: Companies response status:', companiesResponse.status)
      if (!companiesResponse.ok) {
        throw new Error('Failed to fetch companies')
      }
      const companies = await companiesResponse.json()
      console.log('DEBUG: Companies fetched:', companies)
      
      // Fetch recent signals using Exa API for each company
      const allSignals = []
      for (const company of companies) {
        try {
          console.log(`DEBUG: Fetching signals for company: ${company.name} (ID: ${company.id})`)
          const requestBody = {
            company_id: company.id,
            signal_types: ['pricing_change', 'product_update', 'security_update'],
            include_paths: ['/pricing', '/release-notes', '/changelog', '/security'],
            start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
            end_date: new Date().toISOString(),
            use_livecrawl: false
          }
          console.log('DEBUG: Request body:', requestBody)
          
          const signalsResponse = await fetch(`${API_BASE}/signals/detect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })
          
          console.log(`DEBUG: Signals response status for ${company.name}:`, signalsResponse.status)
          
          if (signalsResponse.ok) {
            const signals = await signalsResponse.json()
            console.log(`DEBUG: Signals received for ${company.name}:`, signals)
            // Convert SignalResponse to Signal format for frontend compatibility
            const convertedSignals = signals.map((signal: any) => ({
              id: signal.id || Math.random(),
              company_id: company.id,
              type: signal.type,
              title: signal.rationale || `${signal.type.replace('_', ' ')} - ${signal.vendor}`,
              summary: signal.rationale,
              severity: signal.severity,
              confidence: signal.confidence,
              urls: signal.citations || [signal.url],
              created_at: signal.detected_at
            }))
            allSignals.push(...convertedSignals)
          } else {
            console.error(`DEBUG: Failed to fetch signals for ${company.name}:`, signalsResponse.status, signalsResponse.statusText)
          }
        } catch (error) {
          console.error(`Error fetching signals for ${company.name}:`, error)
        }
      }
      
      // Sort signals by date (most recent first)
      allSignals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      console.log('DEBUG: Final signals array:', allSignals)
      setSignals(allSignals)
    } catch (error) {
      console.error('Error fetching signals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'pricing_change':
        return <TrendingUp className="h-4 w-4" />
      case 'product_update':
        return <FileText className="h-4 w-4" />
      case 'security_update':
        return <Shield className="h-4 w-4" />
      case 'funding':
        return <DollarSign className="h-4 w-4" />
      case 'hiring':
        return <Users className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'pricing_change':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'product_update':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'security_update':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'funding':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'hiring':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatSignalType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Signals & Alerts</h2>
          <p className="text-gray-600 mt-2">Recent changes and updates detected via Exa API</p>
        </div>
        <Button onClick={fetchSignals} disabled={loading}>
          <Bell className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fetching recent signals...</h3>
            <p className="text-gray-600 mb-4">
              Using Exa API to detect the latest changes across your watchlist.
            </p>
          </CardContent>
        </Card>
      ) : signals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent signals found</h3>
            <p className="text-gray-600 mb-4">
              No changes detected in the last 7 days. Try refreshing or check if you have companies in your watchlist.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {signals.map((signal) => (
            <Card key={signal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getSignalColor(signal.type)}`}>
                      {getSignalIcon(signal.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{signal.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={getSignalColor(signal.type)}>
                          {formatSignalType(signal.type)}
                        </Badge>
                        <Badge variant="outline" className={getSeverityColor(signal.severity)}>
                          {signal.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(signal.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {new Date(signal.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{signal.summary}</p>
                
                {signal.urls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {signal.urls.map((url, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {new URL(url).hostname}
                          </a>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default SignalsTab
