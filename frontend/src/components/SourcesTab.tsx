import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Database, Globe, Plus, X } from 'lucide-react'

const SourcesTab = () => {
  const [allowedDomains, setAllowedDomains] = useState([
    'linkedin.com/company/*',
    '*.com/pricing',
    '*.com/release-notes',
    '*.com/security',
    '*.com/blog'
  ])
  const [newDomain, setNewDomain] = useState('')
  const [categories, setCategories] = useState({
    company: true,
    news: true,
    pdf: false,
    linkedin: true,
    github: true,
    financial_report: false
  })
  const [textFilters, setTextFilters] = useState({
    include: '',
    exclude: 'spam, advertisement, unrelated'
  })

  const addDomain = () => {
    if (newDomain && !allowedDomains.includes(newDomain)) {
      setAllowedDomains([...allowedDomains, newDomain])
      setNewDomain('')
    }
  }

  const removeDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domain))
  }

  const toggleCategory = (category: string) => {
    setCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Sources</h2>
        <p className="text-gray-600 mt-2">Control precision and cost by managing allowed domains and content types</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Content Categories
            </CardTitle>
            <CardDescription>
              Select which types of content to include in tear-sheet generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categories).map(([category, enabled]) => (
                <div key={category} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={category} className="text-sm font-medium">
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {category === 'company' && 'Official company pages and profiles'}
                      {category === 'news' && 'News articles and press releases'}
                      {category === 'pdf' && 'PDF documents and reports'}
                      {category === 'linkedin' && 'LinkedIn company profiles'}
                      {category === 'github' && 'GitHub repositories and profiles'}
                      {category === 'financial_report' && 'Financial reports and SEC filings'}
                    </p>
                  </div>
                  <Switch
                    id={category}
                    checked={enabled}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Text Filters</CardTitle>
            <CardDescription>
              Include or exclude content based on specific phrases or keywords
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="include-text">Include Text (comma-separated)</Label>
                <Textarea
                  id="include-text"
                  placeholder="pricing, plans, features"
                  value={textFilters.include}
                  onChange={(e) => setTextFilters(prev => ({...prev, include: e.target.value}))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only include content that contains these phrases
                </p>
              </div>
              <div>
                <Label htmlFor="exclude-text">Exclude Text (comma-separated)</Label>
                <Textarea
                  id="exclude-text"
                  placeholder="spam, advertisement, unrelated"
                  value={textFilters.exclude}
                  onChange={(e) => setTextFilters(prev => ({...prev, exclude: e.target.value}))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Exclude content that contains these phrases
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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
                <Input type="number" defaultValue="25" />
                <p className="text-xs text-gray-500">Maximum results per search</p>
              </div>
              <div className="space-y-2">
                <Label>Content Preference</Label>
                <select className="w-full p-2 border rounded-md">
                  <option value="highlights">Highlights (cheaper)</option>
                  <option value="full_text">Full Text (more expensive)</option>
                  <option value="summary">Structured Summary</option>
                </select>
                <p className="text-xs text-gray-500">Balance cost vs detail</p>
              </div>
              <div className="space-y-2">
                <Label>Livecrawl Mode</Label>
                <select className="w-full p-2 border rounded-md">
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
        <Button>Save Source Configuration</Button>
      </div>
    </div>
  )
}

export default SourcesTab
