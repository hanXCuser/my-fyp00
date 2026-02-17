"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Product, PricingSuggestion, Campaign } from "./types"

interface DashboardContextType {
  // View state
  activeView: string
  setActiveView: (view: string) => void
  
  // Notification
  notification: string | null
  showNotification: (message: string) => void
  
  // Loading states
  isSyncing: boolean
  setIsSyncing: (syncing: boolean) => void
  isExporting: boolean
  setIsExporting: (exporting: boolean) => void
  
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // Dialog states
  showAddProductDialog: boolean
  setShowAddProductDialog: (show: boolean) => void
  showCreateCampaignDialog: boolean
  setShowCreateCampaignDialog: (show: boolean) => void
  
  // Inventory
  inventory: Product[]
  setInventory: (inventory: Product[]) => void
  filteredInventory: Product[]
  
  // Pricing
  pricingSuggestions: PricingSuggestion[]
  setPricingSuggestions: (suggestions: PricingSuggestion[]) => void
  pricingHistory: PricingSuggestion[][]
  setPricingHistory: (history: PricingSuggestion[][]) => void
  
  // Campaigns
  campaigns: Campaign[]
  setCampaigns: (campaigns: Campaign[]) => void
  
  // Actions
  handleSyncData: () => Promise<void>
  handleExport: (type: string) => Promise<void>
  handleApplyPricing: (index: number) => void
  handleApplyAllPricing: () => void
  handleUndoPricing: () => void
  handleCreatePromotion: () => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState("overview")
  const [notification, setNotification] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false)

  const [inventory, setInventory] = useState<Product[]>([
    { name: "Organic Milk 1L", sku: "DRY-001", stock: 245, price: 4.99, status: "In Stock", trend: "+15%" },
    { name: "Whole Wheat Bread", sku: "BKY-042", stock: 89, price: 3.49, status: "Low Stock", trend: "-8%" },
    { name: "Fresh Chicken Breast", sku: "MEA-015", stock: 12, price: 8.99, status: "Critical", trend: "+22%" },
    { name: "Organic Bananas", sku: "PRD-078", stock: 567, price: 1.99, status: "In Stock", trend: "+5%" },
    { name: "Insect Repellent Spray", sku: "HOM-123", stock: 34, price: 7.99, status: "Low Stock", trend: "+180%" },
  ])

  const [pricingSuggestions, setPricingSuggestions] = useState<PricingSuggestion[]>([
    { name: "Ice Cream Tubs", current: 5.99, suggested: 6.49, reason: "High demand", impact: "+$2.4K", applied: false },
    { name: "Flu Medicine", current: 12.99, suggested: 11.49, reason: "Low season", impact: "+$800", applied: false },
    { name: "BBQ Supplies", current: 24.99, suggested: 27.99, reason: "Weekend surge", impact: "+$1.8K", applied: false },
  ])

  const [pricingHistory, setPricingHistory] = useState<PricingSuggestion[][]>([])

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      name: "Summer BBQ Bundle",
      discount: "25% OFF",
      sales: "$12.4K",
      redemptions: 847,
      roi: "+340%",
      status: "Active",
      endDate: "5 days left",
      performance: 92
    },
    {
      name: "Buy 2 Get 1 Free - Beverages",
      discount: "33% OFF",
      sales: "$8.9K",
      redemptions: 623,
      roi: "+280%",
      status: "Active",
      endDate: "12 days left",
      performance: 78
    },
    {
      name: "Weekend Flash Sale",
      discount: "40% OFF",
      sales: "$15.2K",
      redemptions: 1204,
      roi: "+420%",
      status: "Ended",
      endDate: "Completed",
      performance: 100
    },
    {
      name: "Loyalty Member Exclusive",
      discount: "15% OFF",
      sales: "$6.7K",
      redemptions: 412,
      roi: "+190%",
      status: "Active",
      endDate: "Ongoing",
      performance: 65
    },
  ])

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSyncData = async () => {
    setIsSyncing(true)
    showNotification("Syncing data from server...")
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const updated = inventory.map(item => ({
      ...item,
      stock: Math.max(0, item.stock + Math.floor(Math.random() * 20 - 10)),
    }))
    
    updated.forEach(item => {
      if (item.stock > 100) item.status = "In Stock"
      else if (item.stock > 30) item.status = "Low Stock"
      else item.status = "Critical"
    })
    
    setInventory(updated)
    setIsSyncing(false)
    showNotification("Data synced successfully!")
  }

  const handleExport = async (type: string) => {
    setIsExporting(true)
    showNotification(`Preparing ${type} export...`)
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    let csvContent = ""
    let filename = ""
    
    if (type === "consumer behavior") {
      csvContent = "Segment,Percentage,Count\n"
      csvContent += "Families,38%,4882\n"
      csvContent += "Young Professionals,27%,3469\n"
      csvContent += "Seniors,20%,2569\n"
      csvContent += "Students,15%,1927\n"
      filename = "consumer-behavior-report.csv"
    } else if (type === "inventory") {
      csvContent = "Product Name,SKU,Stock,Price,Status,Trend\n"
      inventory.forEach(item => {
        csvContent += `${item.name},${item.sku},${item.stock},$${item.price.toFixed(2)},${item.status},${item.trend}\n`
      })
      filename = "inventory-report.csv"
    } else {
      csvContent = "Report Type,Value\n"
      csvContent += `Export Date,${new Date().toLocaleDateString()}\n`
      csvContent += `Total Products,${inventory.length}\n`
      filename = "export-report.csv"
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setIsExporting(false)
    showNotification(`Downloaded ${filename}`)
  }

  const handleApplyPricing = (index: number) => {
    const updated = [...pricingSuggestions]
    
    if (updated[index].applied) {
      updated[index].applied = false
      setPricingSuggestions(updated)
      showNotification(`Reverted pricing for ${updated[index].name} to $${updated[index].current.toFixed(2)}`)
    } else {
      updated[index].applied = true
      setPricingSuggestions(updated)
      showNotification(`Applied pricing for ${updated[index].name}: $${updated[index].current.toFixed(2)} → $${updated[index].suggested.toFixed(2)}`)
    }
  }

  const handleApplyAllPricing = () => {
    setPricingHistory([...pricingHistory, [...pricingSuggestions]])
    
    const updated = pricingSuggestions.map(s => ({ ...s, applied: true }))
    setPricingSuggestions(updated)
    const totalImpact = pricingSuggestions.reduce((sum, s) => sum + parseFloat(s.impact.replace(/[^0-9.]/g, '')), 0)
    showNotification(`Applied all pricing suggestions! Projected revenue: +$${totalImpact.toFixed(1)}K`)
  }

  const handleUndoPricing = () => {
    if (pricingHistory.length === 0) {
      showNotification("No pricing changes to undo")
      return
    }
    
    const previousState = pricingHistory[pricingHistory.length - 1]
    setPricingSuggestions(previousState)
    setPricingHistory(pricingHistory.slice(0, -1))
    showNotification("Pricing changes undone")
  }

  const handleCreatePromotion = () => {
    setShowCreateCampaignDialog(true)
  }

  const filteredInventory = inventory.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardContext.Provider
      value={{
        activeView,
        setActiveView,
        notification,
        showNotification,
        isSyncing,
        setIsSyncing,
        isExporting,
        setIsExporting,
        searchQuery,
        setSearchQuery,
        showAddProductDialog,
        setShowAddProductDialog,
        showCreateCampaignDialog,
        setShowCreateCampaignDialog,
        inventory,
        setInventory,
        filteredInventory,
        pricingSuggestions,
        setPricingSuggestions,
        pricingHistory,
        setPricingHistory,
        campaigns,
        setCampaigns,
        handleSyncData,
        handleExport,
        handleApplyPricing,
        handleApplyAllPricing,
        handleUndoPricing,
        handleCreatePromotion,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
