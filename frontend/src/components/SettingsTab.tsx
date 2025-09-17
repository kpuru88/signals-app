import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
// import { Textarea } from '@/components/ui/textarea'
import { Clock, Key } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    schedule: {
      enabled: true,
      frequency: 'weekly',
      day: 'monday',
      time: '09:00'
    },
    api_keys: {
      exa_api_key: 'c8b9a631-7ee0-45bf-9a36-e3b6b129ca98',
      slack_webhook: '',
      email_smtp: ''
    },
    retention: {
      tearsheets_days: 365
    },
    signals_cache_duration_seconds: 3600
  })
  const [, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [key]: value
      }
    }))
  }

  // Load settings from backend
  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/settings/configuration`)
      if (response.ok) {
        const settingsData = await response.json()
        setSettings(settingsData)
        console.log('DEBUG: Loaded settings:', settingsData)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save settings to backend
  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${API_BASE}/settings/configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })
      if (response.ok) {
        console.log('Settings saved successfully')
        // Optionally reload settings to confirm
        await loadSettings()
      } else {
        console.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">Configure schedules, API keys, and data retention</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule & Automation
            </CardTitle>
            <CardDescription>
              Configure when to run watchlist scans and generate reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatic Scanning</Label>
                  <p className="text-sm text-gray-500">Enable scheduled watchlist runs</p>
                </div>
                <Switch
                  checked={settings.schedule.enabled}
                  onCheckedChange={(checked) => updateSetting('schedule', 'enabled', checked)}
                />
              </div>

              {settings.schedule.enabled && (
                <>
                  <div>
                    <Label>Frequency</Label>
                    <select 
                      className="w-full p-2 border rounded-md mt-1"
                      value={settings.schedule.frequency}
                      onChange={(e) => updateSetting('schedule', 'frequency', e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Day</Label>
                      <select 
                        className="w-full p-2 border rounded-md mt-1"
                        value={settings.schedule.day}
                        onChange={(e) => updateSetting('schedule', 'day', e.target.value)}
                      >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={settings.schedule.time}
                        onChange={(e) => updateSetting('schedule', 'time', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys & Authentication
            </CardTitle>
            <CardDescription>
              Manage API keys and external service credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Exa API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your Exa API key"
                  value={settings.api_keys.exa_api_key}
                  onChange={(e) => updateSetting('api_keys', 'exa_api_key', e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Required for web search and content retrieval
                </p>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">API Key Status</span>
                </div>
                <p className="text-sm text-yellow-800 mt-1">
                  {settings.api_keys.exa_api_key ? 'API key configured' : 'No API key configured'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>
              Configure how long to keep different types of data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Tear-Sheets</Label>
                <Input
                  type="number"
                  value={settings.retention.tearsheets_days}
                  onChange={(e) => updateSetting('retention', 'tearsheets_days', parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">Days to keep tear-sheets</p>
              </div>
              
              <div className="border-t pt-4">
                <div>
                  <Label>Signals Cache Duration</Label>
                  <Input
                    type="number"
                    value={settings.signals_cache_duration_seconds}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      signals_cache_duration_seconds: parseInt(e.target.value)
                    }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Seconds to cache signals (default: 3600 = 1 hour)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}

export default SettingsTab
