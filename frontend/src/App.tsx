import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Building2, 
  Bell, 
  FileText, 
  Database, 
  Settings
} from 'lucide-react'

import WatchlistTab from './components/WatchlistTab'
import TearSheetsTab from './components/TearSheetsTab'
import SignalsAlertsTab from './components/SignalsAlertsTab'
import ReportsTab from './components/ReportsTab'
import SourcesTab from './components/SourcesTab'
import SettingsTab from './components/SettingsTab'

function App() {
  const [activeTab, setActiveTab] = useState('watchlist')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Signals</h1>
              <Badge variant="secondary" className="ml-3">Beta</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                Live
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="watchlist" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Watchlist
            </TabsTrigger>
            <TabsTrigger value="tearsheets" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Tear-Sheets
            </TabsTrigger>
            <TabsTrigger value="signals" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Signals & Alerts
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watchlist">
            <WatchlistTab />
          </TabsContent>

          <TabsContent value="tearsheets">
            <TearSheetsTab />
          </TabsContent>

          <TabsContent value="signals">
            <SignalsAlertsTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="sources">
            <SourcesTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
