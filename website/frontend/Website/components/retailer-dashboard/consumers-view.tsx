"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Download, Clock, Target, TrendingUp } from "lucide-react"
import { useDashboard } from "./DashboardContext"

export function ConsumersView() {
  const { handleExport, isExporting } = useDashboard()

  return (
    <div className="space-y-6">
      {/* Consumer Stats */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { title: "Total Customers", value: "12,847", icon: Users, color: "text-blue-400" },
          { title: "Avg. Visit Duration", value: "24.5 min", icon: Clock, color: "text-emerald-400" },
          { title: "Conversion Rate", value: "68.2%", icon: Target, color: "text-amber-400" },
          { title: "Customer Satisfaction", value: "4.7/5", icon: TrendingUp, color: "text-cyan-400" },
        ].map((stat, index) => (
          <Card key={index} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Shopping Patterns & Customer Segments */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Peak Shopping Hours</h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {[20, 35, 45, 70, 85, 100, 90, 75, 65, 55, 40, 25].map((height, index) => (
              <div
                key={index}
                className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-400/20 rounded-t-lg hover:from-blue-500/60 hover:to-blue-400/40 transition-all cursor-pointer"
                style={{ height: `${height}%` }}
                title={`${index + 8}:00 - ${height}% traffic`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs text-white/60">
            <span>8AM</span>
            <span>12PM</span>
            <span>4PM</span>
            <span>8PM</span>
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Customer Segments</h3>
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
          <div className="space-y-3">
            {[
              { segment: "Families", percentage: 38, color: "from-blue-400 to-blue-500", count: "4,882" },
              { segment: "Young Professionals", percentage: 27, color: "from-emerald-400 to-emerald-500", count: "3,469" },
              { segment: "Seniors", percentage: 20, color: "from-amber-400 to-amber-500", count: "2,569" },
              { segment: "Students", percentage: 15, color: "from-pink-400 to-pink-500", count: "1,927" },
            ].map((segment, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">{segment.segment}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60">{segment.count}</span>
                    <span className="text-white font-semibold">{segment.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${segment.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${segment.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Purchase Behavior */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Purchase Behavior Analysis</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { category: "Fresh Produce", sales: "$45.2K", buyers: "8,234", avgSpend: "$5.49" },
            { category: "Dairy Products", sales: "$38.7K", buyers: "7,891", avgSpend: "$4.90" },
            { category: "Beverages", sales: "$32.1K", buyers: "9,123", avgSpend: "$3.52" },
            { category: "Snacks", sales: "$28.4K", buyers: "6,547", avgSpend: "$4.34" },
            { category: "Meat & Poultry", sales: "$52.3K", buyers: "5,234", avgSpend: "$9.99" },
            { category: "Bakery", sales: "$21.8K", buyers: "6,789", avgSpend: "$3.21" },
          ].map((cat, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-white font-semibold mb-2">{cat.category}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Sales:</span>
                  <span className="text-emerald-400 font-semibold">{cat.sales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Buyers:</span>
                  <span className="text-white">{cat.buyers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Avg Spend:</span>
                  <span className="text-blue-400">{cat.avgSpend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
