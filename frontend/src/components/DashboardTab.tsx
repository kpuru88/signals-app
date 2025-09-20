import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Building2, 
  Bell, 
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  totalCompanies: number
  totalSignals: number
  recentAlerts: number
  lastUpdate: string
}

interface Signal {
  id: number
  company_id: number
  type: string
  title: string
  summary: string
  severity: string
  confidence: number
  urls: string[]
  citations?: string[]
  created_at: string
}

interface Company {
  id: number
  name: string
  domains: string[]
  linkedin_url?: string
  github_org?: string
  tags: string[]
  created_at: string
}

const DashboardTab = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalSignals: 0,
    recentAlerts: 0,
    lastUpdate: new Date().toISOString()
  })
  const [signals, setSignals] = useState<Signal[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8000'

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const [vendorsResponse, signalsResponse] = await Promise.all([
        fetch(`${API_BASE}/vendors`),
        fetch(`${API_BASE}/signals`)
      ])

      if (vendorsResponse.ok) {
        const vendors = await vendorsResponse.json()
        setCompanies(vendors)
        setStats(prev => ({
          ...prev,
          totalCompanies: vendors.length,
          lastUpdate: new Date().toISOString()
        }))
      }

      if (signalsResponse.ok) {
        const signalsData = await signalsResponse.json()
        setSignals(signalsData)
        
        // Calculate recent alerts (signals from last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const recentSignals = signalsData.filter((signal: Signal) => 
          new Date(signal.created_at) > sevenDaysAgo
        )
        
        setStats(prev => ({
          ...prev,
          totalSignals: signalsData.length,
          recentAlerts: recentSignals.length
        }))
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Here's an overview of your competitive intelligence monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            Live
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monitored Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.totalCompanies}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.5%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Signals Detected
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.totalSignals}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.2%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recent Alerts
            </CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.recentAlerts}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Recent
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sources actives
            </CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : '12'}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Actif
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Track monitoring alerts impacting your competitive intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-gray-500 py-4">Loading alerts...</div>
              ) : signals.length === 0 ? (
                <div className="text-center text-gray-500 py-4">No recent alerts found</div>
              ) : (
                signals.slice(0, 5).map((signal) => {
                  const company = companies.find(c => c.id === signal.company_id)
                  const timeAgo = new Date(signal.created_at)
                  const now = new Date()
                  const diffInHours = Math.floor((now.getTime() - timeAgo.getTime()) / (1000 * 60 * 60))
                  
                  const getSeverityColor = (severity: string) => {
                    switch (severity.toLowerCase()) {
                      case 'critical': return 'red'
                      case 'high': return 'orange'
                      case 'medium': return 'yellow'
                      case 'low': return 'green'
                      default: return 'blue'
                    }
                  }
                  
                  const severityColor = getSeverityColor(signal.severity)
                  const colorClasses = {
                    red: 'border-red-200 bg-red-50 text-red-900',
                    orange: 'border-orange-200 bg-orange-50 text-orange-900',
                    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-900',
                    green: 'border-green-200 bg-green-50 text-green-900',
                    blue: 'border-blue-200 bg-blue-50 text-blue-900'
                  }
                  
                  return (
                    <div key={signal.id} className={`flex items-start gap-3 p-3 border rounded-lg ${colorClasses[severityColor as keyof typeof colorClasses]}`}>
                      <AlertTriangle className={`h-5 w-5 mt-0.5 text-${severityColor}-600`} />
                      <div className="flex-1">
                        <div className="font-medium">{signal.title}</div>
                        <div className="text-sm mt-1 line-clamp-2">
                          {signal.summary.length > 100 ? `${signal.summary.substring(0, 100)}...` : signal.summary}
                        </div>
                        <div className="text-xs mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {diffInHours < 1 ? 'Just now' : 
                           diffInHours < 24 ? `${diffInHours}h ago` : 
                           `${Math.floor(diffInHours / 24)}d ago`}
                          {company && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{company.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`bg-${severityColor}-100 text-${severityColor}-800 border-${severityColor}-200`}>
                        {signal.severity}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Statistics Overview
            </CardTitle>
            <CardDescription>
              Manage, organize and optimize all your competitive intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Total monitoring</div>
                  <div className="text-sm text-gray-600">Active companies</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{stats.totalCompanies}</div>
                  <div className="text-xs text-gray-500">companies</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Active signals</div>
                  <div className="text-sm text-gray-600">Recent detections</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{stats.totalSignals}</div>
                  <div className="text-xs text-gray-500">signals</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Last synchronization</div>
                  <div className="text-sm text-gray-600">Automatic update</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {formatDate(stats.lastUpdate)}
                  </div>
                  <div className="text-xs text-gray-500">last sync</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardTab
