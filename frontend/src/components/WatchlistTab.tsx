import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Play, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
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

interface VendorWatch {
  id: number
  company_id: number
  include_paths: string[]
  last_run_at?: string
  schedule: string
}

const WatchlistTab = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newVendor, setNewVendor] = useState({
    name: '',
    domains: '',
    include_paths: '/pricing,/release-notes,/security',
    linkedin_url: '',
    github_org: '',
    tags: ''
  })

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE}/vendors`)
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const addVendor = async () => {
    if (!newVendor.name || !newVendor.domains) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/vendors/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newVendor.name,
          domains: newVendor.domains.split(',').map(d => d.trim()),
          include_paths: newVendor.include_paths.split(',').map(p => p.trim()),
          linkedin_url: newVendor.linkedin_url || null,
          github_org: newVendor.github_org || null,
          tags: newVendor.tags ? newVendor.tags.split(',').map(t => t.trim()) : []
        })
      })

      if (response.ok) {
        await fetchVendors()
        setIsAddDialogOpen(false)
        setNewVendor({
          name: '',
          domains: '',
          include_paths: '/pricing,/release-notes,/security',
          linkedin_url: '',
          github_org: '',
          tags: ''
        })
      }
    } catch (error) {
      console.error('Error adding vendor:', error)
    } finally {
      setLoading(false)
    }
  }

  const runWatchlist = async (companyId?: number) => {
    setLoading(true)
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
        await fetchVendors()
      }
    } catch (error) {
      console.error('Error running watchlist:', error)
    } finally {
      setLoading(false)
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
          <h2 className="text-3xl font-bold text-gray-900">Vendor Watchlist</h2>
          <p className="text-gray-600 mt-2">Monitor pricing, release notes, and security updates</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => runWatchlist()} 
            disabled={loading}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Run All
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription>
                  Add a vendor to monitor their pricing, release notes, and security updates.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                    placeholder="e.g., Acme Corp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="domains">Domains (comma-separated)</Label>
                  <Input
                    id="domains"
                    value={newVendor.domains}
                    onChange={(e) => setNewVendor({...newVendor, domains: e.target.value})}
                    placeholder="e.g., acme.com, acme.io"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paths">Paths to Monitor (comma-separated)</Label>
                  <Input
                    id="paths"
                    value={newVendor.include_paths}
                    onChange={(e) => setNewVendor({...newVendor, include_paths: e.target.value})}
                    placeholder="/pricing,/release-notes,/security"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="linkedin">LinkedIn URL (optional)</Label>
                  <Input
                    id="linkedin"
                    value={newVendor.linkedin_url}
                    onChange={(e) => setNewVendor({...newVendor, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/company/acme"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
                  <Input
                    id="tags"
                    value={newVendor.tags}
                    onChange={(e) => setNewVendor({...newVendor, tags: e.target.value})}
                    placeholder="e.g., competitor, saas, enterprise"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addVendor} disabled={loading}>
                  Add Vendor
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors yet</h3>
            <p className="text-gray-600 mb-4">Add your first vendor to start tracking pricing and release notes.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vendor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {company.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Monitoring: {company.domains.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runWatchlist(company.id)}
                      disabled={loading}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Monitored Paths</h4>
                    <div className="flex flex-wrap gap-2">
                      {['/pricing', '/release-notes', '/security'].map((path) => (
                        <Badge key={path} variant="secondary" className={`${getPathColor(path)} flex items-center gap-1`}>
                          {getPathIcon(path)}
                          {path}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {company.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {company.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last run: Never
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
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
