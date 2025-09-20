import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Building2, 
  Bell, 
  Database,
  CheckCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import CompanyActivityHeatmap from './CompanyActivityHeatmap'

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


const DashboardTab = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalSignals: 0,
    recentAlerts: 0,
    lastUpdate: new Date().toISOString()
  })
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
        setStats(prev => ({
          ...prev,
          totalCompanies: vendors.length,
          lastUpdate: new Date().toISOString()
        }))
      }

      if (signalsResponse.ok) {
        const signalsData = await signalsResponse.json()
        
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
        <CompanyActivityHeatmap 
          onCompanyClick={(companyId) => {
            console.log('Navigate to company:', companyId)
          }}
        />

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
