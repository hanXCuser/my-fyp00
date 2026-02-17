"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react"

export function StoreComparisonView() {
  const stores = [
    { name: "Downtown Plaza", revenue: "$124.5K", customers: 3420, growth: "+18%", performance: 98, status: "Excellent" },
    { name: "Westside Mall", revenue: "$98.2K", customers: 2890, growth: "+12%", performance: 92, status: "Great" },
    { name: "North Station", revenue: "$87.6K", customers: 2340, growth: "+8%", performance: 85, status: "Good" },
    { name: "South Bay", revenue: "$76.4K", customers: 2120, growth: "+5%", performance: 78, status: "Good" },
    { name: "East Harbor", revenue: "$52.3K", customers: 1560, growth: "-3%", performance: 65, status: "Fair" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Store Comparison</h2>
        <p className="text-white/60 mt-1">Compare performance across all retail locations</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Total Stores</span>
            <Store className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">5</div>
          <div className="text-emerald-400 text-sm">All operational</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Combined Revenue</span>
            <DollarSign className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">$439K</div>
          <div className="text-blue-400 text-sm">This month</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Total Customers</span>
            <Users className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">12.3K</div>
          <div className="text-purple-400 text-sm">+9% this month</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Avg Performance</span>
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">83.6%</div>
          <div className="text-amber-400 text-sm">Score</div>
        </Card>
      </div>

      {/* Store Rankings */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Performance Rankings</h3>
        <div className="space-y-4">
          {stores.map((store, idx) => (
            <div key={idx} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white font-bold">
                #{idx + 1}
              </div>
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                idx === 0 ? 'bg-emerald-500/20' : idx === 1 ? 'bg-blue-500/20' : 'bg-white/10'
              }`}>
                <Store className={`h-6 w-6 ${
                  idx === 0 ? 'text-emerald-400' : idx === 1 ? 'text-blue-400' : 'text-white/60'
                }`} />
              </div>

              <div className="flex-1">
                <div className="text-white font-semibold">{store.name}</div>
                <div className="text-white/60 text-sm mt-1">{store.customers} customers this month</div>
              </div>

              <div className="text-right">
                <div className="text-white font-bold text-lg">{store.revenue}</div>
                <div className={`text-sm flex items-center justify-end ${
                  store.growth.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {store.growth.startsWith('+') ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {store.growth}
                </div>
              </div>

              <div className="text-right">
                <div className="text-white font-bold">{store.performance}%</div>
                <Badge className={
                  store.performance >= 90 ? "bg-emerald-500/20 text-emerald-400" :
                  store.performance >= 75 ? "bg-blue-500/20 text-blue-400" :
                  "bg-amber-500/20 text-amber-400"
                }>
                  {store.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Top Performers by Category</h3>
          <div className="space-y-4">
            {[
              { category: "Revenue", store: "Downtown Plaza", value: "$124.5K" },
              { category: "Customer Traffic", store: "Downtown Plaza", value: "3,420" },
              { category: "Avg Basket Size", store: "Westside Mall", value: "$36.40" },
              { category: "Conversion Rate", store: "North Station", value: "34.8%" },
              { category: "Customer Satisfaction", store: "Westside Mall", value: "4.8/5" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white/60 text-sm">{item.category}</div>
                  <div className="text-white font-medium mt-1">{item.store}</div>
                </div>
                <div className="text-emerald-400 font-bold text-lg">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Improvement Opportunities</h3>
          <div className="space-y-3">
            <div className="p-4 bg-amber-500/10 border border-amber-400/30 rounded-xl">
              <div className="text-amber-400 font-medium mb-1">🎯 East Harbor - Traffic Low</div>
              <div className="text-white/80 text-sm">Implement promotional campaign to boost foot traffic by 15-20%</div>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
              <div className="text-blue-400 font-medium mb-1">💡 South Bay - Basket Size</div>
              <div className="text-white/80 text-sm">Cross-selling opportunities could increase basket size by $8.50</div>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-xl">
              <div className="text-emerald-400 font-medium mb-1">🌟 Best Practice Sharing</div>
              <div className="text-white/80 text-sm">Apply Downtown Plaza's inventory strategy to other locations</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
