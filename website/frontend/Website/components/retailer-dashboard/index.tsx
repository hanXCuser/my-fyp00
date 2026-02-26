"use client"

import { DashboardProvider, useDashboard } from "./DashboardContext"
import { OverviewView } from "./overview-view"
import { InventoryView } from "./inventory-view"
import { PricingView } from "./pricing-view"
import { ConsumersView } from "./consumers-view"
import { PromotionsView } from "./promotions-view"
import { DemandForecastView } from "./demand-forecast-view"
import { ReportsView } from "./reports-view"
import { DynamicPricingView } from "./dynamic-pricing-view"
import { StoreComparisonView } from "./store-comparison-view"
import { RealtimeDataView } from "./realtime-data-view"
import AddProductDialog from "./add-product-dialog"
import { CreateCampaignDialog } from "./create-campaign-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Tag,
  Zap,
  Search,
  Bell,
  Settings,
  RefreshCw,
  LogOut,
  Crown,
  BarChart3,
  ChevronRight,
  HelpCircle,
  FileText,
  Target,
  Store,
  Activity,
} from "lucide-react"

function DashboardContent() {
  const {
    activeView,
    setActiveView,
    notification,
    searchQuery,
    setSearchQuery,
    isSyncing,
    handleSyncData,
    showAddProductDialog,
    setShowAddProductDialog,
    showCreateCampaignDialog,
    setShowCreateCampaignDialog,
  } = useDashboard()

  return (
    <div className="h-screen relative overflow-hidden bg-black">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top">
          <Card className="backdrop-blur-xl bg-emerald-500/20 border border-emerald-400/30 px-6 py-4">
            <p className="text-white font-medium">{notification}</p>
          </Card>
        </div>
      )}

      <div className="relative z-10 p-6 grid grid-cols-12 gap-6 h-screen">
        {/* Left Sidebar Card */}
        <Card className="col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 pb-6 h-fit flex flex-col">
          <div className="space-y-6">
            {/* Logo */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">RetailPro</h1>
              <p className="text-white/60 text-sm">Smart Retail Analytics</p>
            </div>

            {/* Main Navigation */}
            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Main Menu</h4>
              <nav className="space-y-2">
                {[
                  { icon: BarChart3, label: "Overview", view: "overview", iconColor: "text-emerald-400" },
                  { icon: Package, label: "Inventory", view: "inventory", iconColor: "text-blue-400" },
                  { icon: DollarSign, label: "Pricing", view: "pricing", iconColor: "text-amber-400" },
                  { icon: Users, label: "Consumer Insights", view: "consumers", iconColor: "text-cyan-400" },
                  { icon: Tag, label: "Promotions", view: "promotions", iconColor: "text-pink-400" },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => setActiveView(item.view)}
                    className={`w-full justify-start text-base text-white hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02] h-11 ${
                      activeView === item.view ? "bg-white/20 text-white border border-white/30" : ""
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${item.iconColor}`} />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>

            {/* Analytics Tools */}
            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Analytics</h4>
              <nav className="space-y-2">
                {[
                  { icon: TrendingUp, label: "Demand Forecast", view: "forecast", iconColor: "text-emerald-400" },
                  { icon: FileText, label: "Reports", view: "reports", iconColor: "text-blue-400" },
                  { icon: Target, label: "Dynamic Pricing", view: "dynamic-pricing", iconColor: "text-amber-400" },
                  { icon: Store, label: "Store Comparison", view: "store-comparison", iconColor: "text-cyan-400" },
                  { icon: Activity, label: "Real-time Data", view: "realtime", iconColor: "text-pink-400" },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => setActiveView(item.view)}
                    className={`w-full justify-start text-base text-white hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02] h-11 ${
                      activeView === item.view ? "bg-white/20 text-white border border-white/30" : ""
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${item.iconColor}`} />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>

            {/* Administration */}
            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Administration</h4>
              <nav className="space-y-2">
                {[
                  { icon: Settings, label: "Settings", iconColor: "text-slate-300" },
                  { icon: Zap, label: "Automations", iconColor: "text-amber-400" },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-base text-white hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02] h-11"
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${item.iconColor}`} />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex-shrink-0 space-y-4 pt-4 border-t border-white/10">
            <Card className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-2xl p-4">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <Crown className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg">Go Enterprise</h4>
                  <p className="text-white/70 text-sm">Multi-store analytics</p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 transition-all duration-700 ease-out hover:scale-[1.02] text-sm font-medium"
                >
                  Upgrade Now
                  <ChevronRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </Card>

            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-base text-white hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02] h-11"
              >
                <HelpCircle className="mr-3 h-5 w-5 text-cyan-400" />
                Support Center
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base text-white hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02] h-11"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-400" />
                Logout
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content Area */}
        <div className="col-span-10 space-y-6 h-screen overflow-y-auto pb-20">
          {/* Header Card */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {activeView === "overview" && "Retailer Dashboard"}
                  {activeView === "inventory" && "Inventory Management"}
                  {activeView === "pricing" && "Dynamic Pricing"}
                  {activeView === "consumers" && "Consumer Insights"}
                  {activeView === "promotions" && "Promotional Campaigns"}
                </h2>
                <p className="text-white/60">
                  {activeView === "overview" && "Real-time inventory, pricing, and consumer analytics"}
                  {activeView === "inventory" && "Manage stock levels, SKUs, and product availability"}
                  {activeView === "pricing" && "AI-powered pricing recommendations and adjustments"}
                  {activeView === "consumers" && "Behavior analytics and customer segmentation"}
                  {activeView === "promotions" && "Create and track promotional campaigns"}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
                  />
                </div>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white relative">
                  <Bell className="h-5 w-5 text-amber-400" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                </Button>
                <Button 
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 hover:border-emerald-400/50 text-white transition-all duration-700 ease-out hover:scale-[1.02]"
                  onClick={handleSyncData}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Data'}
                </Button>
              </div>
            </div>
          </Card>

          {/* View Rendering */}
          {activeView === "overview" && <OverviewView />}
          {activeView === "inventory" && <InventoryView />}
          {activeView === "pricing" && <PricingView />}
          {activeView === "consumers" && <ConsumersView />}
          {activeView === "promotions" && <PromotionsView />}
          {activeView === "forecast" && <DemandForecastView />}
          {activeView === "reports" && <ReportsView />}
          {activeView === "dynamic-pricing" && <DynamicPricingView />}
          {activeView === "store-comparison" && <StoreComparisonView />}
          {activeView === "realtime" && <RealtimeDataView />}
        </div>
      </div>

      {/* Footer Attribution */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-full px-6 py-2">
          <p className="text-white/80 text-sm">
            RetailPro Analytics Dashboard - Powered by AI
          </p>
        </div>
      </div>

      {/* Add Product Dialog */}
      <AddProductDialog 
        open={showAddProductDialog} 
        onOpenChange={setShowAddProductDialog} 
      />

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog 
        open={showCreateCampaignDialog} 
        onOpenChange={setShowCreateCampaignDialog} 
      />
    </div>
  )
}

export default function RetailerDashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}
