import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Clock, DollarSign, Bell, Key, Zap } from 'lucide-react'

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    schedule: {
      enabled: true,
      frequency: 'weekly',
      day: 'monday',
      time: '09:00'
    },
    budget: {
      monthly_limit: 100,
      alert_threshold: 80
    },
    notifications: {
      slack_enabled: false,
      email_enabled: true,
      webhook_url: ''
    },
    api_keys: {
      exa_api_key: '',
      slack_webhook: '',
      email_smtp: ''
    },
    retention: {
      signals_days: 90,
      reports_days: 365,
      snapshots_days: 30
    }
  })

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">Configure schedules, budgets, integrations, and data retention</p>
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
              <DollarSign className="h-5 w-5" />
              Budget & Cost Control
            </CardTitle>
            <CardDescription>
              Set spending limits and cost alerts for API usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Monthly Budget Limit ($)</Label>
                <Input
                  type="number"
                  value={settings.budget.monthly_limit}
                  onChange={(e) => updateSetting('budget', 'monthly_limit', parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">Maximum monthly spend on Exa API calls</p>
              </div>

              <div>
                <Label>Alert Threshold (%)</Label>
                <Input
                  type="number"
                  value={settings.budget.alert_threshold}
                  onChange={(e) => updateSetting('budget', 'alert_threshold', parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">Get notified when reaching this % of budget</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Current Usage</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p>This month: $0.00 / ${settings.budget.monthly_limit}</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Integrations
            </CardTitle>
            <CardDescription>
              Configure how and where to receive alerts and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive alerts via email</p>
                </div>
                <Switch
                  checked={settings.notifications.email_enabled}
                  onCheckedChange={(checked) => updateSetting('notifications', 'email_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Slack Integration</Label>
                  <p className="text-sm text-gray-500">Send alerts to Slack channel</p>
                </div>
                <Switch
                  checked={settings.notifications.slack_enabled}
                  onCheckedChange={(checked) => updateSetting('notifications', 'slack_enabled', checked)}
                />
              </div>

              {settings.notifications.slack_enabled && (
                <div>
                  <Label>Slack Webhook URL</Label>
                  <Input
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={settings.notifications.webhook_url}
                    onChange={(e) => updateSetting('notifications', 'webhook_url', e.target.value)}
                  />
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Signals & Alerts</Label>
                <Input
                  type="number"
                  value={settings.retention.signals_days}
                  onChange={(e) => updateSetting('retention', 'signals_days', parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">Days to keep signals</p>
              </div>
              <div>
                <Label>Reports</Label>
                <Input
                  type="number"
                  value={settings.retention.reports_days}
                  onChange={(e) => updateSetting('retention', 'reports_days', parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">Days to keep reports</p>
              </div>
              <div>
                <Label>Page Snapshots</Label>
                <Input
                  type="number"
                  value={settings.retention.snapshots_days}
                  onChange={(e) => updateSetting('retention', 'snapshots_days', parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">Days to keep snapshots</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}

export default SettingsTab
