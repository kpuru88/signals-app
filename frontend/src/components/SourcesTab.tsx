import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Globe, Plus, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SourcesTab = () => {
  const [allowedDomains, setAllowedDomains] = useState([
    'linkedin.com/company/*',
    '*.com/pricing',
    '*.com/release-notes',
    '*.com/security',
    '*.com/blog'
  ])
  const [newDomain, setNewDomain] = useState('')
  const [qualityControls, setQualityControls] = useState({
    default_results_limit: 25,
    content_preference: 'highlights',
    livecrawl_mode: 'preferred'
  })
  // const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    // setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/sources/configuration`)
      if (response.ok) {
        const config = await response.json()
        setAllowedDomains(config.allowed_domains || [])
        setQualityControls(config.quality_controls || {})
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
    } finally {
      // setLoading(false)
    }
  }

  const saveConfiguration = async () => {
    setSaving(true)
    try {
      const config = {
        allowed_domains: allowedDomains,
        quality_controls: qualityControls
      }

      const response = await fetch(`${API_BASE}/sources/configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        console.log('Configuration saved successfully')
        // Could add a toast notification here
      } else {
        console.error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  const addDomain = () => {
    if (newDomain && !allowedDomains.includes(newDomain)) {
      setAllowedDomains([...allowedDomains, newDomain])
      setNewDomain('')
    }
  }

  const removeDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domain))
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Sources</h2>
        <p className="text-gray-600 mt-2">Control precision and cost by managing allowed domains and content types</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Allowed Domains & Paths
            </CardTitle>
            <CardDescription>
              Specify which domains and paths to include in searches. Use wildcards (*) for flexible matching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., acme.com/pricing or *.substack.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                />
                <Button onClick={addDomain} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {allowedDomains.map((domain) => (
                  <div key={domain} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-mono">{domain}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDomain(domain)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality & Cost Controls</CardTitle>
            <CardDescription>
              Manage search quality and API usage costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Default Results Limit</Label>
                <Input 
                  type="number" 
                  value={qualityControls.default_results_limit}
                  onChange={(e) => setQualityControls(prev => ({...prev, default_results_limit: parseInt(e.target.value)}))}
                />
                <p className="text-xs text-gray-500">Maximum results per search</p>
              </div>
              <div className="space-y-2">
                <Label>Content Preference</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={qualityControls.content_preference}
                  onChange={(e) => setQualityControls(prev => ({...prev, content_preference: e.target.value}))}
                >
                  <option value="highlights">Highlights (cheaper)</option>
                  <option value="full_text">Full Text (more expensive)</option>
                  <option value="summary">Structured Summary</option>
                </select>
                <p className="text-xs text-gray-500">Balance cost vs detail</p>
              </div>
              <div className="space-y-2">
                <Label>Livecrawl Mode</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={qualityControls.livecrawl_mode}
                  onChange={(e) => setQualityControls(prev => ({...prev, livecrawl_mode: e.target.value}))}
                >
                  <option value="preferred">Preferred (fresh data)</option>
                  <option value="fallback">Fallback (cached OK)</option>
                  <option value="never">Never (cache only)</option>
                </select>
                <p className="text-xs text-gray-500">Freshness vs speed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveConfiguration} disabled={saving}>
          {saving ? 'Saving...' : 'Save Source Configuration'}
        </Button>
      </div>
    </div>
  )
}

export default SourcesTab
