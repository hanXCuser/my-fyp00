"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Sun,
  ChevronRight,
  MapPin,
  Plus,
  Percent,
  X,
} from "lucide-react"
import { useDashboard } from "./DashboardContext"

export function OverviewView() {
  const { handleExport, isExporting, handleCreatePromotion, showNotification } = useDashboard()
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [inventoryFilter, setInventoryFilter] = useState<string>("all")

  const handleFilter = (type: string) => {
    setShowFilterDialog(true)
  }

  const applyFilter = (filterType: string) => {
    setInventoryFilter(filterType)
    setShowFilterDialog(false)
    showNotification(`Filter applied: ${filterType === "all" ? "All items" : filterType}`)
  }

  const inventoryItems = [
    { name: "Organic Milk 1L", sku: "DRY-001", stock: 245, price: "$4.99", status: "In Stock", trend: "+15%" },
    { name: "Whole Wheat Bread", sku: "BKY-042", stock: 89, price: "$3.49", status: "Low Stock", trend: "-8%" },
    { name: "Fresh Chicken Breast", sku: "MEA-015", stock: 12, price: "$8.99", status: "Critical", trend: "+22%" },
    { name: "Organic Bananas", sku: "PRD-078", stock: 567, price: "$1.99", status: "In Stock", trend: "+5%" },
  ]

  const filteredInventory = inventoryItems.filter(item => {
    if (inventoryFilter === "all") return true
    return item.status === inventoryFilter
  })

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { title: "Total Revenue", value: "$284.7K", change: "+18%", icon: DollarSign, color: "text-emerald-400", up: true },
          { title: "Active SKUs", value: "3,847", change: "+24", icon: Package, color: "text-blue-400", up: true },
          { title: "Avg. Basket Size", value: "$67.50", change: "+12%", icon: ShoppingCart, color: "text-amber-400", up: true },
          { title: "Low Stock Alerts", value: "23", change: "-8", icon: AlertTriangle, color: "text-red-400", up: false },
        ].map((stat, index) => (
          <Card
            key={index}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 transition-all duration-700 ease-out hover:scale-[1.02] hover:bg-white/15"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <div className="flex items-center gap-1">
                  {stat.up ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-400" />
                  )}
                  <p className={`text-sm ${stat.up ? "text-emerald-400" : "text-red-400"}`}>{stat.change}</p>
                </div>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Inventory and Predictive Analytics Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Real-Time Inventory Status */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Real-Time Inventory</h3>
            <div className="flex items-center space-x-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => handleFilter('inventory')}
              >
                <Filter className="mr-2 h-4 w-4 text-blue-400" />
                Filter
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredInventory.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{product.name}</p>
                        <p className="text-xs text-white/60">SKU: {product.sku}</p>
                      </div>
                      <div className="text-center mx-4">
                        <p className="font-bold text-white text-sm">{product.stock}</p>
                        <p className="text-xs text-white/60">units</p>
                      </div>
                      <div className="text-center mx-4">
                        <p className="font-bold text-white text-sm">{product.price}</p>
                        <p className="text-xs text-emerald-400">{product.trend}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`text-xs ${
                            product.status === "In Stock"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/30"
                              : product.status === "Low Stock"
                                ? "bg-amber-500/20 text-amber-400 border-amber-400/30"
                                : "bg-red-500/20 text-red-400 border-red-400/30"
                          }`}
                        >
                          {product.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:bg-blue-500/10 h-6 px-2 text-xs"
                          onClick={() => {
                            showNotification(`Adjusting price for ${product.name}`)
                          }}
                        >
                          Adjust
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Demand Forecasting */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Demand Forecasting</h3>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
              <Calendar className="h-4 w-4 mr-2 text-cyan-400" />
              This Week
            </Button>
          </div>

          <div className="space-y-6">
            {/* Seasonal Prediction */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-400" />
                  <span className="text-white font-medium">Summer Season Insights</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30">Active</Badge>
              </div>
              <div className="space-y-2">
                {[
                  { product: "Insect Repellents", forecast: "+180%", confidence: 94 },
                  { product: "Sunscreen Products", forecast: "+145%", confidence: 91 },
                  { product: "Bottled Water", forecast: "+85%", confidence: 88 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">{item.product}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-semibold text-sm">{item.forecast}</span>
                      <div className="w-16 bg-white/10 rounded-full h-2">
                        <div
                          className="bg-emerald-400 h-2 rounded-full"
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Pricing Suggestions */}
            <div>
              <h4 className="text-white font-medium mb-3">Dynamic Pricing Suggestions</h4>
              <div className="space-y-3">
                {[
                  { name: "Ice Cream Tubs", current: "$5.99", suggested: "$6.49", reason: "High demand", impact: "+$2.4K" },
                  { name: "Flu Medicine", current: "$12.99", suggested: "$11.49", reason: "Low season", impact: "+$800" },
                  { name: "BBQ Supplies", current: "$24.99", suggested: "$27.99", reason: "Weekend surge", impact: "+$1.8K" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-white/60 text-xs">{item.reason}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-white/60 text-xs">Current</p>
                        <p className="text-white text-sm">{item.current}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-emerald-400" />
                      <div className="text-center">
                        <p className="text-emerald-400 text-xs">Suggested</p>
                        <p className="text-emerald-400 text-sm font-semibold">{item.suggested}</p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-xs">
                        {item.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast Accuracy */}
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">94.2%</p>
              <p className="text-white/60 text-sm">Forecast Accuracy (30 days)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Consumer Behavior and Promotions */}
      <div className="grid grid-cols-2 gap-6">
        {/* Consumer Behavior Analytics */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Consumer Behavior</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={() => handleExport('consumer behavior')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4 text-blue-400" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Shopping Patterns */}
            <div>
              <h4 className="text-white/80 text-sm mb-3">Peak Shopping Hours</h4>
              <div className="flex items-end justify-between h-24 gap-1">
                {[20, 35, 45, 70, 85, 100, 90, 75, 65, 55, 40, 25].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-400/20 rounded-t-sm hover:from-blue-500/60 hover:to-blue-400/40 transition-all cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${index + 8}:00 - ${height}% traffic`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/60">
                <span>8AM</span>
                <span>12PM</span>
                <span>4PM</span>
                <span>8PM</span>
              </div>
            </div>

            {/* Customer Segments */}
            <div>
              <h4 className="text-white/80 text-sm mb-3">Customer Segments</h4>
              <div className="space-y-2">
                {[
                  { segment: "Families", percentage: 38, color: "from-blue-400 to-blue-500" },
                  { segment: "Young Professionals", percentage: 27, color: "from-emerald-400 to-emerald-500" },
                  { segment: "Seniors", percentage: 20, color: "from-amber-400 to-amber-500" },
                  { segment: "Students", percentage: 15, color: "from-pink-400 to-pink-500" },
                ].map((segment, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">{segment.segment}</span>
                      <span className="text-white">{segment.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${segment.color} h-2 rounded-full`}
                        style={{ width: `${segment.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { category: "Fresh Produce", sales: "$45.2K", growth: "+12%" },
                { category: "Dairy Products", sales: "$38.7K", growth: "+8%" },
                { category: "Beverages", sales: "$32.1K", growth: "+15%" },
                { category: "Snacks", sales: "$28.4K", growth: "+22%" },
              ].map((cat, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/60 text-xs">{cat.category}</p>
                  <p className="text-white font-semibold">{cat.sales}</p>
                  <p className="text-emerald-400 text-xs">{cat.growth}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Promotional Performance */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Promotional Performance</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={handleCreatePromotion}
            >
              <Plus className="mr-2 h-4 w-4 text-emerald-400" />
              New Campaign
            </Button>
          </div>

          <div className="space-y-4">
            {/* Active Promotions */}
            {[
              {
                name: "Summer BBQ Bundle",
                discount: "25% OFF",
                sales: "$12.4K",
                redemptions: 847,
                roi: "+340%",
                status: "Active",
                endDate: "5 days left",
              },
              {
                name: "Buy 2 Get 1 Free - Beverages",
                discount: "33% OFF",
                sales: "$8.9K",
                redemptions: 623,
                roi: "+280%",
                status: "Active",
                endDate: "12 days left",
              },
              {
                name: "Weekend Flash Sale",
                discount: "40% OFF",
                sales: "$15.2K",
                redemptions: 1204,
                roi: "+420%",
                status: "Ended",
                endDate: "Completed",
              },
              {
                name: "Loyalty Member Exclusive",
                discount: "15% OFF",
                sales: "$6.7K",
                redemptions: 412,
                roi: "+190%",
                status: "Active",
                endDate: "Ongoing",
              },
            ].map((promo, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-lg flex items-center justify-center">
                      <Percent className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{promo.name}</p>
                      <p className="text-white/60 text-xs">{promo.discount}</p>
                    </div>
                  </div>
                  <Badge
                    className={`text-xs ${
                      promo.status === "Active"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/30"
                        : "bg-white/10 text-white/60 border-white/20"
                    }`}
                  >
                    {promo.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div>
                    <p className="text-white/60 text-xs">Sales</p>
                    <p className="text-white font-semibold text-sm">{promo.sales}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Redemptions</p>
                    <p className="text-white font-semibold text-sm">{promo.redemptions}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">ROI</p>
                    <p className="text-emerald-400 font-semibold text-sm">{promo.roi}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Duration</p>
                    <p className="text-white/80 text-sm">{promo.endDate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Price Comparison Banner */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-500/20 border border-blue-400/30 rounded-2xl">
              <MapPin className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Multi-Store Price Comparison</h3>
              <p className="text-white/80 text-lg mb-3">
                Compare prices across 12 supermarket chains in real-time
              </p>
              <div className="flex items-center space-x-6 text-sm text-white/70">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span>Live Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span>3,500+ Products Tracked</span>
                </div>
              </div>
            </div>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8">
            View Comparison
          </Button>
        </div>
      </Card>

      {/* Filter Dialog */}
      {showFilterDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Filter Inventory</h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setShowFilterDialog(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => applyFilter("all")}
                className={`w-full justify-start text-white hover:bg-white/10 ${
                  inventoryFilter === "all" ? "bg-white/20 border border-white/30" : ""
                }`}
              >
                All Items
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => applyFilter("In Stock")}
                className={`w-full justify-start text-white hover:bg-white/10 ${
                  inventoryFilter === "In Stock" ? "bg-white/20 border border-white/30" : ""
                }`}
              >
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                In Stock
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => applyFilter("Low Stock")}
                className={`w-full justify-start text-white hover:bg-white/10 ${
                  inventoryFilter === "Low Stock" ? "bg-white/20 border border-white/30" : ""
                }`}
              >
                <span className="w-2 h-2 bg-amber-400 rounded-full mr-2" />
                Low Stock
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => applyFilter("Critical")}
                className={`w-full justify-start text-white hover:bg-white/10 ${
                  inventoryFilter === "Critical" ? "bg-white/20 border border-white/30" : ""
                }`}
              >
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2" />
                Critical
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
