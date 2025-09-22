import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, ExternalLink, Users, FileText, BarChart3 } from 'lucide-react'
import HiringTrendsChart from './HiringTrendsChart'

interface Company {
  id: number
  name: string
  domains: string[]
  linkedin_url?: string
  github_org?: string
  tags: string[]
}

interface TearSheet {
  company: Company
  overview: string
  executives: any
  hiring_signals: any
  citations: string[]
}

const TearSheetsTab = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [tearSheet, setTearSheet] = useState<TearSheet | null>(null)
  const [loading, setLoading] = useState(false)

  const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8000'

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      checkExistingTearSheet(selectedCompany.id)
    }
  }, [selectedCompany])

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_BASE}/vendors`)
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const checkExistingTearSheet = async (companyId: number) => {
    try {
      const response = await fetch(`${API_BASE}/tearsheet/${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setTearSheet(data)
      } else if (response.status === 404) {
        // No existing tearsheet found, reset to null
        setTearSheet(null)
      }
    } catch (error) {
      console.error('Error checking existing tear-sheet:', error)
      setTearSheet(null)
    }
  }

  const generateTearSheet = async (companyId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/tearsheet/${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setTearSheet(data)
      }
    } catch (error) {
      console.error('Error generating tear-sheet:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Company Tear-Sheets</h2>
        <p className="text-gray-600 mt-2">One-page briefs with company overview, funding, and key updates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Select a company to generate a tear-sheet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCompany?.id === company.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCompany(company)}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{company.name}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {company.domains.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              {selectedCompany && (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => generateTearSheet(selectedCompany.id)}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : (tearSheet ? 'Regenerate Tear-Sheet' : 'Generate Tear-Sheet')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!selectedCompany ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No company selected</h3>
                <p className="text-gray-600">Select a company from the list to view or generate a tear-sheet</p>
              </CardContent>
            </Card>
          ) : !tearSheet ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tear-sheet available for {selectedCompany.name}</h3>
                <p className="text-gray-600 mb-4">Click the "Generate Tear-Sheet" button to create a fresh one</p>
                <Button 
                  onClick={() => generateTearSheet(selectedCompany.id)}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Tear-Sheet'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-green-600" />
                        {tearSheet.company.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {tearSheet.company.domains.join(', ')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Overview
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {tearSheet.overview}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Key Executives
                      </h3>
                      {tearSheet.executives && tearSheet.executives.executives && tearSheet.executives.executives.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600 mb-2">
                            Found {tearSheet.executives.total_executives} executives and {tearSheet.executives.total_recent_hires} recent hires
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {tearSheet.executives.executives.slice(0, 5).map((exec: any, index: number) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                                <div className="font-medium text-sm text-gray-900">{exec.name}</div>
                                {exec.snippet && (
                                  <div className="text-xs text-gray-600 mt-1">{exec.snippet}</div>
                                )}
                                {exec.url && (
                                  <a 
                                    href={exec.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs underline mt-1 inline-block"
                                  >
                                    View Source
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600">No executive information available</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Hiring Signals
                      </h3>
                      {tearSheet.hiring_signals && typeof tearSheet.hiring_signals === 'object' && !tearSheet.hiring_signals.status ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {tearSheet.hiring_signals.current_year_jobs || 0}
                              </div>
                              <div className="text-sm text-gray-600">Jobs in {new Date().getFullYear()}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {tearSheet.hiring_signals.last_year_jobs || 0}
                              </div>
                              <div className="text-sm text-gray-600">Jobs in {new Date().getFullYear() - 1}</div>
                            </div>
                          </div>
                          
                          {/* Department-wise job breakdown with chart */}
                          {tearSheet.hiring_signals.departments && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="h-5 w-5 text-green-600" />
                                <h4 className="text-lg font-semibold text-gray-900">Jobs by Department</h4>
                              </div>
                              
                              {/* Bar Chart */}
                              <div className="bg-white border rounded-lg p-4">
                                <HiringTrendsChart 
                                  departments={Object.fromEntries(
                                    Object.entries(tearSheet.hiring_signals.departments).map(([dept, jobs]) => [
                                      dept, 
                                      Array.isArray(jobs) ? jobs.length : 0
                                    ])
                                  )}
                                />
                              </div>
                              
                            </div>
                          )}
                          
                        </div>
                      ) : (
                        <p className="text-gray-600">
                          {tearSheet.hiring_signals?.status || 'Information not available'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sources (auto-refreshed)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tearSheet.citations.map((url, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {new URL(url).hostname}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TearSheetsTab
