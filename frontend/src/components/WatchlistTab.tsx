import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Play, 
  TrendingUp,
  Clock,
  Building2,
  Globe,
  FileText,
  Shield
} from 'lucide-react'

interface Company {
  id: number
  name: string
  domains: string[]
  linkedin_url?: string
  github_org?: string
  tags: string[]
  created_at?: string
}


interface CompanyWithWatch {
  company: Company
  include_paths: string[]
}

const WatchlistTab = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [companiesWithWatch, setCompaniesWithWatch] = useState<CompanyWithWatch[]>([])
  const [loading, setLoading] = useState(false)
  const [runAllLoading, setRunAllLoading] = useState(false)
  const [runningCompanies, setRunningCompanies] = useState<Set<number>>(new Set())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCompany, setNewCompany] = useState({
    name: '',
    domains: '',
    include_paths: '/pricing,/release-notes,/security',
    linkedin_url: '',
    github_org: '',
    tags: ''
  })

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_BASE}/companies`)
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
        
        const companiesWithWatchData = await Promise.all(
          data.map(async (company: Company) => {
            try {
              const watchResponse = await fetch(`${API_BASE}/companies/${company.id}/watch`)
              if (watchResponse.ok) {
                const watchData = await watchResponse.json()
                return {
                  company: watchData.company,
                  include_paths: watchData.include_paths
                }
              }
            } catch (error) {
              console.error(`Error fetching watch data for company ${company.id}:`, error)
            }
            return {
              company: company,
              include_paths: ['/pricing', '/release-notes', '/security']
            }
          })
        )
        setCompaniesWithWatch(companiesWithWatchData)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const addCompany = async () => {
    if (!newCompany.name || !newCompany.domains) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/companies/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCompany.name,
          domains: newCompany.domains.split(',').map(d => d.trim()),
          include_paths: newCompany.include_paths.split(',').map(p => p.trim()),
          linkedin_url: newCompany.linkedin_url || null,
          github_org: newCompany.github_org || null,
          tags: newCompany.tags ? newCompany.tags.split(',').map(t => t.trim()) : []
        })
      })

      if (response.ok) {
        await fetchCompanies()
        setIsAddDialogOpen(false)
        setNewCompany({
          name: '',
          domains: '',
          include_paths: '/pricing,/release-notes,/security',
          linkedin_url: '',
          github_org: '',
          tags: ''
        })
      }
    } catch (error) {
      console.error('Error adding company:', error)
    } finally {
      setLoading(false)
    }
  }

  const runWatchlist = async (companyId?: number) => {
    if (companyId) {
      setRunningCompanies(prev => new Set([...prev, companyId]))
    } else {
      setRunAllLoading(true)
    }
    
    try {
      const response = await fetch(`${API_BASE}/run/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_ids: companyId ? [companyId] : null
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Watchlist run result:', result)
        await fetchCompanies()
      }
    } catch (error) {
      console.error('Error running watchlist:', error)
    } finally {
      if (companyId) {
        setRunningCompanies(prev => {
          const newSet = new Set(prev)
          newSet.delete(companyId)
          return newSet
        })
      } else {
        setRunAllLoading(false)
      }
    }
  }

  const getPathIcon = (path: string) => {
    if (path.includes('pricing')) return <TrendingUp className="h-4 w-4" />
    if (path.includes('release') || path.includes('changelog')) return <FileText className="h-4 w-4" />
    if (path.includes('security')) return <Shield className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
  }

  const getPathColor = (path: string) => {
    if (path.includes('pricing')) return 'bg-green-100 text-green-800'
    if (path.includes('release') || path.includes('changelog')) return 'bg-blue-100 text-blue-800'
    if (path.includes('security')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Company Watchlist</h2>
          <p className="text-gray-600 mt-2">Monitor pricing, release notes, and security updates</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => runWatchlist()} 
            disabled={runAllLoading}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            {runAllLoading ? 'Running...' : 'Run All'}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Add a company to monitor their pricing, release notes, and security updates.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    placeholder="e.g., Acme Corp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="domains">Domains (comma-separated)</Label>
                  <Input
                    id="domains"
                    value={newCompany.domains}
                    onChange={(e) => setNewCompany({...newCompany, domains: e.target.value})}
                    placeholder="e.g., acme.com, acme.io"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paths">Paths to Monitor (comma-separated)</Label>
                  <Input
                    id="paths"
                    value={newCompany.include_paths}
                    onChange={(e) => setNewCompany({...newCompany, include_paths: e.target.value})}
                    placeholder="/pricing,/release-notes,/security"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="linkedin">LinkedIn URL (optional)</Label>
                  <Input
                    id="linkedin"
                    value={newCompany.linkedin_url}
                    onChange={(e) => setNewCompany({...newCompany, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/company/acme"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
                  <Input
                    id="tags"
                    value={newCompany.tags}
                    onChange={(e) => setNewCompany({...newCompany, tags: e.target.value})}
                    placeholder="e.g., competitor, saas, enterprise"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addCompany} disabled={loading}>
                  Add Company
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {companies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-600 mb-4">Add your first company to start tracking pricing and release notes.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {companiesWithWatch.map((companyWithWatch) => (
            <Card key={companyWithWatch.company.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {companyWithWatch.company.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Monitoring: {companyWithWatch.company.domains.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runWatchlist(companyWithWatch.company.id)}
                      disabled={runningCompanies.has(companyWithWatch.company.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {runningCompanies.has(companyWithWatch.company.id) ? 'Running...' : 'Run Now'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Monitored Paths</h4>
                    <div className="flex flex-wrap gap-2">
                      {companyWithWatch.include_paths.map((path) => (
                        <Badge key={path} variant="secondary" className={`${getPathColor(path)} flex items-center gap-1`}>
                          {getPathIcon(path)}
                          {path}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {companyWithWatch.company.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {companyWithWatch.company.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      Last run: Never
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      READY
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default WatchlistTab
