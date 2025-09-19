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
  BarChart3
} from 'lucide-react'

interface DashboardStats {
  totalCompanies: number
  totalSignals: number
  recentAlerts: number
  lastUpdate: string
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
      const [vendorsResponse] = await Promise.all([
        fetch(`${API_BASE}/vendors`)
      ])

      if (vendorsResponse.ok) {
        const vendors = await vendorsResponse.json()
        setStats({
          totalCompanies: vendors.length,
          totalSignals: vendors.length * 3,
          recentAlerts: Math.floor(vendors.length * 0.3),
          lastUpdate: new Date().toISOString()
        })
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
          <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord</h2>
          <p className="text-gray-600 mt-2">Voici un aperçu de votre surveillance concurrentielle</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            En direct
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Entreprises surveillées
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
              Signaux détectés
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
              Alertes récentes
            </CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.recentAlerts}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Récent
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
              Alertes Récentes
            </CardTitle>
            <CardDescription>
              Suivez les alertes de surveillance impactant votre veille concurrentielle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-red-900">Changement de prix détecté</div>
                  <div className="text-sm text-red-700 mt-1">
                    Modification tarifaire importante chez un concurrent
                  </div>
                  <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Il y a 2 heures
                  </div>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  Critique
                </Badge>
              </div>

              <div className="flex items-start gap-3 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-yellow-900">Nouvelle fonctionnalité</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Lancement produit détecté via les notes de version
                  </div>
                  <div className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Il y a 4 heures
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Modéré
                </Badge>
              </div>

              <div className="flex items-start gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-green-900">Mise à jour de sécurité</div>
                  <div className="text-sm text-green-700 mt-1">
                    Correctif de sécurité publié par un fournisseur
                  </div>
                  <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Il y a 6 heures
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Info
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Aperçu des Statistiques
            </CardTitle>
            <CardDescription>
              Gérez, organisez et optimisez toute votre veille concurrentielle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Surveillance totale</div>
                  <div className="text-sm text-gray-600">Entreprises actives</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{stats.totalCompanies}</div>
                  <div className="text-xs text-gray-500">entreprises</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Signaux actifs</div>
                  <div className="text-sm text-gray-600">Détections récentes</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{stats.totalSignals}</div>
                  <div className="text-xs text-gray-500">signaux</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Dernière synchronisation</div>
                  <div className="text-sm text-gray-600">Mise à jour automatique</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {formatDate(stats.lastUpdate)}
                  </div>
                  <div className="text-xs text-gray-500">dernière sync</div>
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
