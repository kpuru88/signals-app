import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard,
  Bell, 
  Database, 
  Settings,
  Eye,
  FileText,
  Sprout
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

import DashboardTab from './components/DashboardTab'
import WatchlistTab from './components/WatchlistTab'
import TearSheetsTab from './components/TearSheetsTab'
import SignalsAlertsTab from './components/SignalsAlertsTab'
import SourcesTab from './components/SourcesTab'
import SettingsTab from './components/SettingsTab'

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    component: DashboardTab
  },
  {
    id: 'watchlist',
    title: 'Surveillance',
    icon: Eye,
    component: WatchlistTab
  },
  {
    id: 'tearsheets',
    title: 'Fiches',
    icon: FileText,
    component: TearSheetsTab
  },
  {
    id: 'signals',
    title: 'Signaux & Alertes',
    icon: Bell,
    component: SignalsAlertsTab
  },
  {
    id: 'sources',
    title: 'Sources',
    icon: Database,
    component: SourcesTab
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    component: SettingsTab
  }
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || DashboardTab

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-lg">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Signals</h1>
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                        className="w-full justify-start"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-sidebar-border">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">En direct</span>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Last synchronization with other modules: 19/09/2025, 2:33:13 PM</span>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            <ActiveComponent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default App
