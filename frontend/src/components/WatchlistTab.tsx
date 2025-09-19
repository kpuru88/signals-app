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
  Shield,
  Edit2,
  Check,
  X
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


const WatchlistTab = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [companyLoading, setCompanyLoading] = useState<{[key: number]: boolean}>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [companyResults, setCompanyResults] = useState<{[key: number]: any}>({})
  const [companyDialogs, setCompanyDialogs] = useState<{[key: number]: boolean}>({})
  const [sourcesConfig, setSourcesConfig] = useState<{allowed_domains: string[]} | null>(null)
  
  // Cache configuration - 1 hour default
  const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

  
  // Load sources configuration and cached results on component mount
  useEffect(() => {
    loadSourcesConfiguration()
    loadCachedCompanyResults()
  }, [])

  const loadSourcesConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE}/sources/configuration`)
      if (response.ok) {
        const config = await response.json()
        setSourcesConfig(config)
      }
    } catch (error) {
      console.error('Error loading sources configuration:', error)
    }
  }

  const loadCachedCompanyResults = () => {
    try {
      const cached = localStorage.getItem('companyResults')
      if (cached) {
        const { data, timestamps } = JSON.parse(cached)
        const now = Date.now()
        
        // Filter out expired results for each company
        const validResults: {[key: number]: any} = {}
        const validTimestamps: {[key: number]: number} = {}
        
        Object.keys(data).forEach(companyIdStr => {
          const companyId = parseInt(companyIdStr)
          const companyTimestamp = timestamps[companyId] || 0
          
          if (now - companyTimestamp < CACHE_DURATION) {
            validResults[companyId] = data[companyId]
            validTimestamps[companyId] = companyTimestamp
          }
        })
        
        if (Object.keys(validResults).length > 0) {
          setCompanyResults(validResults)
          console.log('Loaded cached company results:', validResults)
        } else {
          console.log('All cached company results expired, clearing cache')
          localStorage.removeItem('companyResults')
        }
      }
    } catch (error) {
      console.error('Error loading cached company results:', error)
    }
  }

  const saveCachedCompanyResults = (results: {[key: number]: any}, updatedCompanyId?: number) => {
    try {
      // Get existing cache data
      const existingCached = localStorage.getItem('companyResults')
      let existingData = {}
      let existingTimestamps: {[key: number]: number} = {}
      
      if (existingCached) {
        const parsed = JSON.parse(existingCached)
        existingData = parsed.data || {}
        existingTimestamps = parsed.timestamps || {}
      }
      
      // Merge with new results
      const mergedData = { ...existingData, ...results }
      
      // Update timestamps - only update the specific company that was just run
      const now = Date.now()
      const mergedTimestamps = { ...existingTimestamps }
      
      if (updatedCompanyId !== undefined) {
        mergedTimestamps[updatedCompanyId] = now
      } else {
        // If no specific company ID, update all companies in results
        Object.keys(results).forEach(companyIdStr => {
          mergedTimestamps[parseInt(companyIdStr)] = now
        })
      }
      
      const cacheData = {
        data: mergedData,
        timestamps: mergedTimestamps
      }
      localStorage.setItem('companyResults', JSON.stringify(cacheData))
      console.log('Saved company results to cache:', mergedData, 'with timestamps:', mergedTimestamps)
    } catch (error) {
      console.error('Error saving cached company results:', error)
    }
  }

  const getCompanyCacheInfo = (companyId: number) => {
    try {
      const cached = localStorage.getItem('companyResults')
      if (cached) {
        const { data, timestamps } = JSON.parse(cached)
        const now = Date.now()
        
        // Check if cache is still valid and has data for this company
        const companyTimestamp = timestamps[companyId] || 0
        if ((now - companyTimestamp < CACHE_DURATION) && data[companyId]) {
          const minutesAgo = Math.floor((now - companyTimestamp) / (1000 * 60))
          return {
            isCached: true,
            minutesAgo: minutesAgo
          }
        }
      }
    } catch (error) {
      console.error('Error checking cached company results:', error)
    }
    return { isCached: false, minutesAgo: 0 }
  }

  // Function to get paths from sources
  const getPathsFromSources = () => {
    if (sourcesConfig && sourcesConfig.allowed_domains) {
      return sourcesConfig.allowed_domains.join(', ')
    }
    // Fallback to default paths
    return '/pricing,/release-notes,/security'
  }

  const [newVendor, setNewVendor] = useState({
    name: '',
    domains: '',
    include_paths: '',
    linkedin_url: '',
    github_org: '',
    tags: ''
  })

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

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
          include_paths: getPathsFromSources(),
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


  const runCompanyWatchlist = async (companyId: number) => {
    console.log(`DEBUG: Starting runCompanyWatchlist for company ID: ${companyId}`)
    setCompanyLoading(prev => ({...prev, [companyId]: true}))
    
        // Clear cache for this company when running fresh
        const newResults = { ...companyResults }
        delete newResults[companyId]
        setCompanyResults(newResults)
        saveCachedCompanyResults(newResults, companyId)
    
    try {
      const response = await fetch(`${API_BASE}/run/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_ids: [companyId]
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Company watchlist run result:', result)
        
        // Store results for this specific company
        if (result.results && result.results.length > 0) {
          const companyResult = result.results[0]
          console.log(`DEBUG: Storing company result for ID ${companyId}:`, companyResult)
          const newResults = {
            ...companyResults,
            [companyId]: companyResult
          }
          
          console.log(`DEBUG: New results object:`, newResults)
          setCompanyResults(newResults)
          saveCachedCompanyResults(newResults, companyId)
          
          // Show success message
          const urlsFound = companyResult.urls_found || 0
          const signalsCreated = companyResult.signals_created || 0
          
          alert(`Company watchlist run completed!\n\nURLs found: ${urlsFound}\nSignals created: ${signalsCreated}\n\nClick "View Results" to see detailed analysis.`)
        }
        
        await fetchVendors()
      } else {
        const errorData = await response.json()
        alert(`Error running watchlist for company: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error running company watchlist:', error)
      alert(`Error running watchlist: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setCompanyLoading(prev => ({...prev, [companyId]: false}))
    }
  }


  const startEditing = (company: Company) => {
    setEditingCompany(company.id)
    setEditingName(company.name)
  }

  const cancelEditing = () => {
    setEditingCompany(null)
    setEditingName('')
  }

  const saveEditing = async (companyId: number) => {
    if (!editingName.trim()) return

    setLoading(true)
    try {
      const company = companies.find(c => c.id === companyId)
      if (!company) return

      const response = await fetch(`${API_BASE}/vendors/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName.trim(),
          domains: company.domains,
          include_paths: ['/pricing', '/release-notes', '/security'],
          linkedin_url: company.linkedin_url || null,
          github_org: company.github_org || null,
          tags: company.tags
        })
      })

      if (response.ok) {
        await fetchVendors()
        setEditingCompany(null)
        setEditingName('')
      } else {
        const errorData = await response.json()
        alert(`Error updating company: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating company:', error)
      alert(`Error updating company: ${error instanceof Error ? error.message : 'Network error'}`)
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
    if (path.includes('release') || path.includes('changelog')) return 'bg-green-100 text-green-800'
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="paths">Paths to Monitor (comma-separated)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewVendor({...newVendor, include_paths: getPathsFromSources()})}
                      className="text-xs"
                    >
                      Use Sources
                    </Button>
                  </div>
                  <Input
                    id="paths"
                    value={newVendor.include_paths}
                    onChange={(e) => setNewVendor({...newVendor, include_paths: e.target.value})}
                    placeholder="/pricing,/release-notes,/security"
                  />
                  {sourcesConfig && (
                    <p className="text-xs text-gray-500">
                      Available paths from Sources: {sourcesConfig.allowed_domains.join(', ')}
                    </p>
                  )}
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
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-green-600" />
                      {editingCompany === company.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="text-lg font-semibold h-8"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveEditing(company.id)
                              } else if (e.key === 'Escape') {
                                cancelEditing()
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveEditing(company.id)}
                            disabled={loading || !editingName.trim()}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            disabled={loading}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span>{company.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(company)}
                            disabled={loading}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Monitoring: {company.domains.join(', ')}
                    </CardDescription>
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Last run: Never
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                        READY
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => runCompanyWatchlist(company.id)}
                        disabled={companyLoading[company.id] || loading}
                        size="sm"
                        variant="outline"
                      >
                        {companyLoading[company.id] ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Run Now
                      </Button>
                      
                      <Button
                        onClick={() => setCompanyDialogs(prev => ({...prev, [company.id]: true}))}
                        disabled={!companyResults[company.id]}
                        size="sm"
                        variant="secondary"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Results
                        {(() => {
                          const cacheInfo = getCompanyCacheInfo(company.id)
                          if (cacheInfo.isCached) {
                            const timeText = cacheInfo.minutesAgo === 0 ? 'now' : 
                                           cacheInfo.minutesAgo === 1 ? '1 min ago' : 
                                           `${cacheInfo.minutesAgo} min ago`
                            return (
                              <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                Updated {timeText}
                              </span>
                            )
                          }
                          return null
                        })()}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Watchlist Analysis Results</DialogTitle>
            <DialogDescription>
              Detailed analysis of recent updates, pricing changes, and discounts from the last 30 days
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-yellow-100 border border-yellow-300 rounded mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Debug:</strong> Dialog is open: false, 
              Results available: false
            </p>
          </div>
          
          {false ? (
            <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  0
                </div>
                <div className="text-sm text-gray-600">Companies Checked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  0
                </div>
                <div className="text-sm text-gray-600">URLs Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  0
                </div>
                <div className="text-sm text-gray-600">Signals Created</div>
              </div>
            </div>

            {/* Company Results */}
              {[].map((result: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{result.company}</h3>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>{result.urls_found || 0} URLs</span>
                    <span>•</span>
                    <span>{result.signals_created || 0} signals</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Monitored Paths:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(result.paths_checked || []).map((path: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{path}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {result.urls_found === 0 && (
                    <div className="text-sm text-gray-500 italic">
                      No recent updates found in the last 30 days
                    </div>
                  )}
                  
                    {result.answer_content && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis Results:</h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div 
                            className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: result.answer_content
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>')
                                .replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+?)(?=[\s<>"{}|\\^`[\]]|$|\))/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:text-green-800 underline">$1</a>')
                            }}
                          />
                        </div>
                        
                        {result.citations && result.citations.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Source URLs:</h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {result.citations.map((citation: any, i: number) => (
                                <div key={i} className="text-xs border-l-2 border-green-200 pl-2">
                                  <a 
                                    href={typeof citation === 'string' ? citation : citation.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800 underline break-all"
                                  >
                                    {typeof citation === 'string' ? citation : citation.url}
                                  </a>
                                  {typeof citation === 'object' && citation.title && (
                                    <div className="text-gray-500 mt-1 truncate">
                                      {citation.title}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  
                  {result.signals_created > 0 && (
                    <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                      <span>✓</span>
                      <span>New signals created - check the Signals tab for details</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Debug Information (if available) */}
            {false && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {}
                </pre>
              </div>
            )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No results available</p>
              <p className="text-sm">Run the watchlist first to see analysis results</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Individual Company Dialogs */}
      {companies.map((company) => (
        <Dialog 
          key={company.id}
          open={companyDialogs[company.id] || false} 
          onOpenChange={(open) => setCompanyDialogs(prev => ({...prev, [company.id]: open}))}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{company.name} - Analysis Results</DialogTitle>
              <DialogDescription>
                Recent updates, pricing changes, and discounts from the last 30 days
              </DialogDescription>
            </DialogHeader>
            
            {(() => {
              console.log(`DEBUG: Dialog for company ${company.id}, companyResults:`, companyResults[company.id])
              return companyResults[company.id]
            })() && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {companyResults[company.id].urls_found || 0}
                    </div>
                    <div className="text-sm text-gray-600">URLs Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {companyResults[company.id].signals_created || 0}
                    </div>
                    <div className="text-sm text-gray-600">Signals Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(companyResults[company.id].paths_checked || []).length}
                    </div>
                    <div className="text-sm text-gray-600">Paths Monitored</div>
                  </div>
                </div>

                {/* Monitored Paths */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Monitored Paths:</h4>
                  <div className="flex flex-wrap gap-1">
                    {(companyResults[company.id].paths_checked || []).map((path: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{path}</Badge>
                    ))}
                  </div>
                </div>

                {/* AI Analysis Results */}
                {companyResults[company.id].answer_content && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis Results:</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div 
                        className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: companyResults[company.id].answer_content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>')
                            .replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+?)(?=[\s<>"{}|\\^`[\]]|$|\))/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:text-green-800 underline">$1</a>')
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Source URLs */}
                {companyResults[company.id].citations && companyResults[company.id].citations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Source URLs:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {companyResults[company.id].citations.map((citation: any, i: number) => (
                        <div key={i} className="text-xs border-l-2 border-green-200 pl-2">
                          <a 
                            href={typeof citation === 'string' ? citation : citation.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 underline break-all"
                          >
                            {typeof citation === 'string' ? citation : citation.url}
                          </a>
                          {typeof citation === 'object' && citation.title && (
                            <div className="text-gray-500 mt-1 truncate">
                              {citation.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results Message */}
                {!companyResults[company.id].answer_content && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent updates found in the last 30 days</p>
                    <p className="text-sm">Try running the analysis again or check back later</p>
                  </div>
                )}

                {/* Signals Created Indicator */}
                {companyResults[company.id].signals_created > 0 && (
                  <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                    <span>✓</span>
                    <span>New signals created - check the Signals tab for details</span>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}

export default WatchlistTab
