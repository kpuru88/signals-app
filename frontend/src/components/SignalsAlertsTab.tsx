import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  DollarSign, 
  Shield, 
  Package, 
  Clock, 
  ExternalLink, 
  Bell, 
  BellOff, 
  CheckSquare, 
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  Activity
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface SignalResponse {
  id?: number;
  type: 'pricing_change' | 'product_update' | 'security_update' | 'funding' | 'hiring';
  severity: 'low' | 'medium' | 'high';
  vendor?: string;
  url?: string;
  detected_at?: string;
  evidence?: Array<{
    snippet: string;
    confidence: number;
  }>;
  rationale?: string;
  impacted_areas?: string[];
  tags?: string[];
  confidence?: number;
  source_authority?: string;
  diff_magnitude?: number;
  keyword_overlap?: number;
  score?: number;
  last_crawled?: string;
  citations?: string[];
  // Database fields
  company_id?: number;
  title?: string;
  summary?: string;
  urls?: string[];
  created_at?: string;
}

interface Company {
  id: number;
  name: string;
  domains: string[];
}

// Cache interface
interface CacheEntry {
  data: SignalResponse[];
  timestamp: number;
  filterKey: string;
}

const SignalsAlertsTab = () => {
  const [signals, setSignals] = useState<SignalResponse[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedSignalType, setSelectedSignalType] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Cache state
  // const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [settings, setSettings] = useState<any>(null);
  
  // Cache configuration - will be updated from settings
  const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const CACHE_DURATION = settings?.signals_cache_duration_seconds ? settings.signals_cache_duration_seconds * 1000 : DEFAULT_CACHE_DURATION;
  const CACHE_KEY_PREFIX = 'signals_cache_';
  const LAST_FETCH_KEY = 'signals_last_fetch';

  // Cache utility functions
  const getCacheKey = () => {
    return `signals_${selectedCompany || 'all'}_${selectedSignalType || 'all'}_${selectedSeverity || 'all'}`;
  };

  const isCacheValid = (cacheEntry: CacheEntry): boolean => {
    const now = Date.now();
    return (now - cacheEntry.timestamp) < CACHE_DURATION;
  };

  const getCachedSignals = (): SignalResponse[] | null => {
    const cacheKey = getCacheKey();
    const storageKey = CACHE_KEY_PREFIX + cacheKey;
    
    try {
      const cachedData = localStorage.getItem(storageKey);
      if (cachedData) {
        const cacheEntry: CacheEntry = JSON.parse(cachedData);
        if (isCacheValid(cacheEntry)) {
          console.log(`Using cached signals from localStorage for key: ${cacheKey}`);
          return cacheEntry.data;
        } else {
          // Remove expired cache entry
          localStorage.removeItem(storageKey);
          console.log(`Removed expired cache entry for key: ${cacheKey}`);
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    return null;
  };

  const setCachedSignals = (data: SignalResponse[]) => {
    const cacheKey = getCacheKey();
    const storageKey = CACHE_KEY_PREFIX + cacheKey;
    const cacheEntry: CacheEntry = {
      data,
      timestamp: Date.now(),
      filterKey: cacheKey
    };
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(cacheEntry));
      localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
      console.log(`Cached signals to localStorage for key: ${cacheKey}`);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  const clearCache = () => {
    try {
      // Clear all signals cache entries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(LAST_FETCH_KEY);
      setLastFetchTime(null);
      console.log('Cache cleared from localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  // Load settings configuration
  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/settings/configuration`);
      if (response.ok) {
        const settingsData = await response.json();
        setSettings(settingsData);
        console.log('DEBUG: Loaded settings:', settingsData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
    loadSettings();
    
    // Load last fetch time from localStorage on component mount
    try {
      const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
      if (lastFetch) {
        setLastFetchTime(parseInt(lastFetch));
      }
    } catch (error) {
      console.error('Error loading last fetch time from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      // Check cache first before making any API calls
      const cachedSignals = getCachedSignals();
      if (cachedSignals) {
        console.log('Using cached signals, no API call needed');
        setSignals(cachedSignals);
        return;
      }
      
      // Only fetch if no cached data
      fetchSignals();
    }
  }, [companies, selectedCompany, selectedSignalType, selectedSeverity]);

  const fetchSignals = async (_forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      // Get all companies to detect signals for
      const companiesToFetch = selectedCompany 
        ? companies.filter(c => c.id === selectedCompany)
        : companies;
      
      if (companiesToFetch.length === 0) {
        setSignals([]);
        return;
      }

      const allSignals: SignalResponse[] = [];
      
      // Use Exa API to detect signals for each company
      for (const company of companiesToFetch) {
        try {
          const signalsResponse = await fetch(`${API_BASE}/signals/detect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              company_id: company.id,
              signal_types: selectedSignalType 
                ? [selectedSignalType as any] 
                : ['pricing_change', 'product_update', 'security_update'],
              include_paths: ['/pricing', '/release-notes', '/changelog', '/security'],
              start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
              end_date: new Date().toISOString(),
              use_livecrawl: false
            })
          });
          
          if (signalsResponse.ok) {
            const signals = await signalsResponse.json();
            console.log(`Found ${signals.length} signals for ${company.name}`);
            allSignals.push(...signals);
          } else {
            console.error(`Failed to fetch signals for ${company.name}: ${signalsResponse.status}`);
          }
        } catch (error) {
          console.error(`Error fetching signals for ${company.name}:`, error);
        }
      }
      
      // Filter by severity if selected
      const filteredSignals = selectedSeverity 
        ? allSignals.filter(s => s.severity === selectedSeverity)
        : allSignals;
      
      // Sort signals by date (most recent first)
      filteredSignals.sort((a, b) => new Date(b.detected_at || '').getTime() - new Date(a.detected_at || '').getTime());
      
      console.log(`Total signals found: ${filteredSignals.length}`);
      setSignals(filteredSignals);
      
      // Cache the results
      setCachedSignals(filteredSignals);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_BASE}/vendors`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const detectSignals = async (companyId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/signals/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          signal_types: ['pricing_change', 'product_update', 'security_update'],
          include_paths: ['/pricing', '/release-notes', '/changelog', '/security'],
          use_livecrawl: true
        })
      });
      
      if (response.ok) {
        const newSignals = await response.json();
        const updatedSignals = [...newSignals, ...signals];
        
        // Update signals state
        setSignals(updatedSignals);
        
        // Update cache with new signals
        setCachedSignals(updatedSignals);
        setLastFetchTime(Date.now());
      }
    } catch (error) {
      console.error('Error detecting signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const muteSignal = async (signalId: number) => {
    try {
      await fetch(`${API_BASE}/signals/${signalId}/mute`, {
        method: 'POST'
      });
      setSignals(prev => prev.filter(s => s.id !== signalId));
    } catch (error) {
      console.error('Error muting signal:', error);
    }
  };

  const createFollowUp = async (signalId: number) => {
    const taskDescription = prompt('Enter follow-up task description:');
    if (taskDescription) {
      try {
        await fetch(`${API_BASE}/signals/${signalId}/follow-up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task_description: taskDescription })
        });
        alert('Follow-up task created!');
      } catch (error) {
        console.error('Error creating follow-up:', error);
      }
    }
  };


  const _getSignalIcon = (type: string) => {
    switch (type) {
      case 'pricing_change':
        return <DollarSign className="h-4 w-4" />;
      case 'security_update':
        return <Shield className="h-4 w-4" />;
      case 'product_update':
        return <Package className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'P0';
      case 'medium':
        return 'P1';
      case 'low':
        return 'P2';
      default:
        return 'P2';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getWhyItMatters = (signalType: string, impactedAreas: string[]) => {
    const templates = {
      'pricing_change': 'Pricing changes directly impact your cost structure and competitive positioning. Monitor for budget adjustments and competitive analysis opportunities.',
      'product_update': 'Product updates may affect your integration roadmap, feature parity, or competitive differentiation. Track for strategic planning and technical alignment.',
      'security_update': 'Security updates are critical for compliance and risk management. Immediate attention required for vulnerability assessments and security posture updates.',
      'funding': 'Funding announcements indicate market validation and competitive landscape shifts. Monitor for strategic planning and market intelligence.',
      'hiring': 'Hiring patterns reveal company growth trajectory and strategic priorities. Track for talent acquisition insights and competitive intelligence.'
    };
    
    const baseTemplate = templates[signalType as keyof typeof templates] || 'This change may impact your strategic planning and competitive positioning.';
    
    if (impactedAreas && impactedAreas.length > 0) {
      return `${baseTemplate} Key areas affected: ${impactedAreas.join(', ')}.`;
    }
    
    return baseTemplate;
  };

  // Signals are already filtered in fetchSignals based on selected filters
  const filteredSignals = signals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Signals & Alerts</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Recent changes detected via Exa API across your watchlist</span>
            {lastFetchTime && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                <Clock className="h-3 w-3" />
                Cached {formatTimeAgo(new Date(lastFetchTime).toISOString())} (cache: {Math.round(CACHE_DURATION / 1000)}s)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          {lastFetchTime && (
            <button
              onClick={clearCache}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Clear cache"
            >
              <Activity className="h-4 w-4" />
              Clear Cache
            </button>
          )}
          <button
            onClick={() => fetchSignals(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            title="Force refresh (bypass cache)"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Force Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <select
                value={selectedCompany || ''}
                onChange={(e) => setSelectedCompany(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signal Type</label>
              <select
                value={selectedSignalType || ''}
                onChange={(e) => setSelectedSignalType(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="pricing_change">Pricing Change</option>
                <option value="product_update">Product Update</option>
                <option value="security_update">Security Update</option>
                <option value="funding">Funding</option>
                <option value="hiring">Hiring</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={selectedSeverity || ''}
                onChange={(e) => setSelectedSeverity(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Severities</option>
                <option value="high">High (P0)</option>
                <option value="medium">Medium (P1)</option>
                <option value="low">Low (P2)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Company Detection Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Detect New Signals</h3>
        <div className="flex flex-wrap gap-2">
          {companies.map(company => (
            <button
              key={company.id}
              onClick={() => detectSignals(company.id)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {company.name}
            </button>
          ))}
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Fetching recent signals via Exa API...</span>
          </div>
        )}

        {filteredSignals.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No signals found</h3>
            <p className="text-gray-600">Try detecting signals for a specific company or adjust your filters.</p>
          </div>
        )}

        {filteredSignals.map((signal) => (
          <div key={signal.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Header: "P0 • Pricing changed at Acme" */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(signal.severity)}`}>
                  {getSeverityBadge(signal.severity)}
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm font-medium text-gray-900">
                  {signal.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} changed at {signal.vendor || 'Stripe'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => muteSignal(signal.id!)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Mute signal"
                >
                  <BellOff className="h-4 w-4" />
                </button>
                <button
                  onClick={() => createFollowUp(signal.id!)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Create follow-up"
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chip: "/pricing • Live-crawled 7m ago" */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                {(signal.url || signal.urls?.[0] || '').split('/').slice(3).join('/') || '/pricing'}
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                Live-crawled {signal.last_crawled ? formatTimeAgo(signal.last_crawled) : (signal.created_at ? formatTimeAgo(signal.created_at) : 'unknown')}
              </span>
            </div>

            {/* Summary: 2-3 bullets */}
            <div className="mb-4">
              <ul className="space-y-1 text-sm text-gray-700">
                {signal.evidence && signal.evidence.length > 0 ? (
                  signal.evidence.slice(0, 3).map((evidence, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      <span><strong>{evidence.snippet}</strong></span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span><strong>{signal.rationale || signal.summary || 'No additional details available'}</strong></span>
                  </li>
                )}
              </ul>
            </div>

            {/* Links: Source, Open diff, Mute vendor, Create follow-up task */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
              <a
                href={signal.url || signal.urls?.[0] || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                Source
              </a>
              <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
                <TrendingUp className="h-3 w-3" />
                Open diff
              </button>
              <button 
                onClick={() => muteSignal(signal.id!)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <Bell className="h-3 w-3" />
                Mute vendor
              </button>
              <button 
                onClick={() => createFollowUp(signal.id!)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <CheckSquare className="h-3 w-3" />
                Create follow-up task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalsAlertsTab;
