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

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchSignals()
  }, [])

  const fetchSignals = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/signals`)
      if (response.ok) {
        const data = await response.json()
        setSignals(data)
      }
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
          <p className="text-gray-600 mt-2">Detected changes and important updates</p>
        </div>
        <Button onClick={fetchSignals} disabled={loading}>
          <Bell className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {signals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No signals yet</h3>
            <p className="text-gray-600 mb-4">
              Run your watchlist to start detecting changes and generating signals.
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
