import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Play, 
  Clock,
  Building2,
  Globe,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  FileText
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

interface SearchResult {
  name: string
  domains: string[]
  description?: string
  suggested_paths: string[]
  linkedin_url?: string
  tags: string[]
}

const WatchlistTab = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyLoading, setCompanyLoading] = useState<{[key: number]: boolean}>({})
  const [editingCompany, setEditingCompany] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [companyResults, setCompanyResults] = useState<{[key: number]: any}>({})
  const [companyDialogs, setCompanyDialogs] = useState<{[key: number]: boolean}>({})
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const CACHE_DURATION = 60 * 60 * 1000
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    loadCachedCompanyResults()
    fetchVendors()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "" || searchQuery.trim().length < 3) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(async () => {
      try {
        const currentQuery = searchQuery.trim()
        if (currentQuery.length < 3) {
          setIsSearching(false)
          return
        }
        
        const response = await fetch(`${API_BASE}/companies/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: currentQuery,
            max_results: 10
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (currentQuery === searchQuery.trim()) {
            setSearchResults(data.results || [])
          }
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsSearching(false)
      }
    }, 2500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, API_BASE])

  const loadCachedCompanyResults = () => {
    try {
      const cached = localStorage.getItem('companyResults')
      if (cached) {
        const parsedCache = JSON.parse(cached)
        const validCache: {[key: number]: any} = {}
        
        Object.keys(parsedCache).forEach(companyIdStr => {
          const companyId = parseInt(companyIdStr)
          const companyCache = parsedCache[companyId]
          
          if (companyCache && companyCache.timestamp) {
            const now = Date.now()
            const cacheAge = now - companyCache.timestamp
            
            if (cacheAge < CACHE_DURATION) {
              validCache[companyId] = companyCache.data
            }
          }
        })
        
        if (Object.keys(validCache).length > 0) {
          setCompanyResults(validCache)
        }
      }
    } catch (error) {
      console.error('Error loading cached company results:', error)
    }
  }

  const saveCachedCompanyResults = (results: {[key: number]: any}, companyId?: number) => {
    try {
      const existingCache = localStorage.getItem('companyResults')
      let cacheData: {[key: number]: any} = {}
      
      if (existingCache) {
        cacheData = JSON.parse(existingCache)
      }
      
      if (companyId && results[companyId]) {
        cacheData[companyId] = {
          data: results[companyId],
          timestamp: Date.now()
        }
      } else {
        Object.keys(results).forEach(companyIdStr => {
          const id = parseInt(companyIdStr)
          cacheData[id] = {
            data: results[id],
            timestamp: Date.now()
          }
        })
      }
      
      localStorage.setItem('companyResults', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error saving cached company results:', error)
    }
  }

  const getCompanyCacheInfo = (companyId: number) => {
    try {
      const cached = localStorage.getItem('companyResults')
      if (cached) {
        const parsedCache = JSON.parse(cached)
        const companyCache = parsedCache[companyId]
        
        if (companyCache && companyCache.timestamp) {
          const now = Date.now()
          const minutesAgo = Math.floor((now - companyCache.timestamp) / (1000 * 60))
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

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const addToWatchlist = async (company: SearchResult) => {
    try {
      const vendorData = {
        name: company.name,
        domains: company.domains,
        include_paths: company.suggested_paths || ['/pricing', '/release-notes', '/security'],
        linkedin_url: company.linkedin_url || '',
        github_org: '',
        tags: company.tags || []
      }

      const response = await fetch(`${API_BASE}/vendors/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData)
      })

      if (response.ok) {
        const newCompany = await response.json()
        setCompanies(prev => [...prev, newCompany])
        alert(`${company.name} added to watchlist!`)
      } else {
        const errorData = await response.json()
        alert(`Failed to add ${company.name}: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding company:', error)
      alert(`Failed to add ${company.name}. Please try again.`)
    }
  }

  const isInWatchlist = (companyName: string) => {
    return companies.some(company => company.name.toLowerCase() === companyName.toLowerCase())
  }

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

  const runCompanyWatchlist = async (companyId: number) => {
    console.log(`DEBUG: Starting runCompanyWatchlist for company ID: ${companyId}`)
    setCompanyLoading(prev => ({...prev, [companyId]: true}))
    
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
        
        const updatedResults = {
          ...companyResults,
          [companyId]: result
        }
        setCompanyResults(updatedResults)
        saveCachedCompanyResults(updatedResults, companyId)
        
        setCompanyDialogs(prev => ({...prev, [companyId]: true}))
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        alert(`Error running watchlist: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error running company watchlist:', error)
      alert('Network error: Unable to run watchlist. Please check your connection and try again.')
    } finally {
      setCompanyLoading(prev => ({...prev, [companyId]: false}))
    }
  }

  const startEditing = (companyId: number, currentName: string) => {
    setEditingCompany(companyId)
    setEditingName(currentName)
  }

  const cancelEditing = () => {
    setEditingCompany(null)
    setEditingName('')
  }

  const saveEditing = async (companyId: number) => {
    if (!editingName.trim()) {
      alert('Company name cannot be empty')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/vendors/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName.trim()
        })
      })

      if (response.ok) {
        const updatedCompany = await response.json()
        setCompanies(prev => prev.map(company => 
          company.id === companyId ? updatedCompany : company
        ))
        setEditingCompany(null)
        setEditingName('')
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        alert(`Error updating company: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Network error: Unable to update company. Please check your connection and try again.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">Company Search & Watchlist</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Search for companies by name or domain and add them to your watchlist to track pricing, release notes, and security updates.
          </p>
        </div>
      </div>

      <div className="relative min-h-[500px] bg-gradient-to-br from-green-200 via-emerald-200 to-teal-200 rounded-3xl flex flex-col items-center justify-center text-gray-700 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />
        </div>
        
        <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto px-8">
          <div className="w-20 h-20 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-green-600" />
          </div>
          
          <div className="relative max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for anything amazing..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="pl-12 pr-4 py-4 h-14 bg-white/90 backdrop-blur-sm border-0 rounded-2xl shadow-lg placeholder:text-gray-500 text-gray-900 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
          
          <p className="text-gray-600 text-lg">
            Discover powerful search patterns and implementations
          </p>
        </div>
        
        <div className="absolute top-10 left-10 w-2 h-2 bg-white/60 rounded-full" />
        <div className="absolute top-20 right-20 w-1 h-1 bg-white/70 rounded-full" />
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-white/50 rounded-full" />
        <div className="absolute bottom-10 right-10 w-1 h-1 bg-white/80 rounded-full" />
      </div>

      {companies.length > 0 && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-4 py-2">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'} in watchlist
          </Badge>
        </div>
      )}

      {searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-muted-foreground">
              {isSearching ? "Searching..." : `${searchResults.length} results for "${searchQuery}"`}
            </h3>
          </div>

          <div className="grid gap-4">
            {searchResults.map((company, index) => (
              <Card key={index} className="hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img 
                          src={`https://logo.clearbit.com/${company.domains?.[0]}`}
                          alt={`${company.name} logo`}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <Building2 className="w-6 h-6 text-muted-foreground hidden" />
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-gray-800">{company.name}</h4>
                          <p className="text-sm text-primary">{company.domains?.[0]}</p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {company.description}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant={isInWatchlist(company.name) ? "secondary" : "default"}
                      size="sm"
                      onClick={() => {
                        if (!isInWatchlist(company.name)) {
                          addToWatchlist(company);
                        }
                      }}
                      className="flex-shrink-0"
                      disabled={isInWatchlist(company.name)}
                    >
                      {isInWatchlist(company.name) ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Watchlist
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {searchResults.length === 0 && !isSearching && searchQuery && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold text-muted-foreground mb-2">No companies found</h4>
                <p className="text-sm text-muted-foreground">
                  Try searching with a different company name or domain.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!searchQuery && companies.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">Start searching for companies</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Enter a company name or domain in the search bar above to discover and track companies of interest.
            </p>
          </CardContent>
        </Card>
      )}

      {companies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Watchlist</h3>
          <div className="grid gap-6">
            {companies.map((company) => (
              <Card key={company.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        {editingCompany === company.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-8 text-lg font-semibold"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditing(company.id)
                                if (e.key === 'Escape') cancelEditing()
                              }}
                            />
                            <Button size="sm" variant="ghost" onClick={() => saveEditing(company.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditing}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{company.name}</CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(company.id, company.name)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {company.domains.join(', ')}
                            </span>
                          </div>
                          {company.linkedin_url && (
                            <a
                              href={company.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {companyResults[company.id] && (
                        <div className="flex items-center gap-1">
                          {getCompanyCacheInfo(company.id).isCached && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {getCompanyCacheInfo(company.id).minutesAgo}m ago
                            </Badge>
                          )}
                        </div>
                      )}
                      <Button
                        onClick={() => runCompanyWatchlist(company.id)}
                        disabled={companyLoading[company.id]}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {companyLoading[company.id] ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Running...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Run Analysis
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-4">
                    {company.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {companies.map((company) => (
        <Dialog 
          key={`dialog-${company.id}`}
          open={companyDialogs[company.id] || false} 
          onOpenChange={(open) => setCompanyDialogs(prev => ({...prev, [company.id]: open}))}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                {company.name} - Analysis Results
              </DialogTitle>
              <DialogDescription>
                Recent updates and changes detected for {company.name}
              </DialogDescription>
            </DialogHeader>
            
            {companyResults[company.id] && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {companyResults[company.id].signals_created || 0}
                    </div>
                    <div className="text-sm text-gray-600">Signals Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(companyResults[company.id].citations || []).length}
                    </div>
                    <div className="text-sm text-gray-600">Sources Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(companyResults[company.id].paths_checked || []).length}
                    </div>
                    <div className="text-sm text-gray-600">Paths Monitored</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Monitored Paths:</h4>
                  <div className="flex flex-wrap gap-1">
                    {(companyResults[company.id].paths_checked || []).map((path: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{path}</Badge>
                    ))}
                  </div>
                </div>

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

                {companyResults[company.id].citations && companyResults[company.id].citations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Citations</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {companyResults[company.id].citations.map((citation: any, i: number) => (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {typeof citation === 'object' && citation.title && (
                                <div className="font-medium text-sm text-gray-900 mb-1 truncate">
                                  {citation.title}
                                </div>
                              )}
                              {typeof citation === 'object' && citation.snippet && (
                                <div className="text-sm text-gray-600 mb-2">
                                  {citation.snippet}
                                </div>
                              )}
                              {typeof citation === 'object' && citation.text && (
                                <div className="text-xs text-gray-500 line-clamp-3">
                                  {citation.text}
                                </div>
                              )}
                              {typeof citation === 'string' && (
                                <div className="text-sm text-gray-600">
                                  {citation}
                                </div>
                              )}
                            </div>
                            {typeof citation === 'object' && citation.url && (
                              <a 
                                href={citation.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 underline text-xs whitespace-nowrap flex-shrink-0"
                              >
                                View Source
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!companyResults[company.id].answer_content && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent updates found in the last 30 days</p>
                    <p className="text-sm">Try running the analysis again or check back later</p>
                  </div>
                )}

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
