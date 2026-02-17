"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Users, ShoppingCart, Eye, TrendingUp } from "lucide-react"

export function RealtimeDataView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Real-time Data</h2>
          <p className="text-white/60 mt-1">Live monitoring of store activities and customer behavior</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
          <Activity className="mr-1 h-3 w-3 animate-pulse" />
          Live Updates
        </Badge>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Active Shoppers</span>
            <Users className="h-5 w-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">147</div>
          <div className="text-emerald-400 text-sm">+12 in last 5 min</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Live Transactions</span>
            <ShoppingCart className="h-5 w-5 text-blue-400 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">$2,340</div>
          <div className="text-blue-400 text-sm">Last hour</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Product Views</span>
            <Eye className="h-5 w-5 text-purple-400 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">1,234</div>
          <div className="text-purple-400 text-sm">Last 10 minutes</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Conversion Rate</span>
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">28.4%</div>
          <div className="text-amber-400 text-sm">+3.2% vs yesterday</div>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Live Activity Feed</h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {[
            { time: "Just now", action: "Purchase", detail: "Customer bought Organic Milk 1L", amount: "$4.99", type: "sale" },
            { time: "1 min ago", action: "Stock Alert", detail: "Fresh Chicken Breast running low (12 units)", type: "warning" },
            { time: "2 min ago", action: "Purchase", detail: "Customer bought 3 items, total $23.45", amount: "$23.45", type: "sale" },
            { time: "2 min ago", action: "Price Change", detail: "Ice Cream Tubs price updated to $5.99", type: "info" },
            { time: "3 min ago", action: "High Traffic", detail: "45 customers in store - peak hour alert", type: "info" },
            { time: "4 min ago", action: "Purchase", detail: "Customer bought Premium Coffee Beans", amount: "$14.49", type: "sale" },
            { time: "5 min ago", action: "Review", detail: "5-star review received for Whole Wheat Bread", type: "positive" },
            { time: "6 min ago", action: "Purchase", detail: "Customer bought 2 items, total $15.98", amount: "$15.98", type: "sale" },
            { time: "7 min ago", action: "Promotion", detail: "Summer BBQ Bundle campaign triggered", type: "info" },
            { time: "8 min ago", action: "Purchase", detail: "Customer bought Organic Bananas", amount: "$1.99", type: "sale" },
          ].map((activity, idx) => (
            <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              activity.type === 'sale' ? 'bg-emerald-500/10 border-emerald-400/30' :
              activity.type === 'warning' ? 'bg-amber-500/10 border-amber-400/30' :
              activity.type === 'positive' ? 'bg-blue-500/10 border-blue-400/30' :
              'bg-white/5 border-white/10'
            } ${idx === 0 ? 'animate-pulse' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${
                    activity.type === 'sale' ? 'text-emerald-400' :
                    activity.type === 'warning' ? 'text-amber-400' :
                    activity.type === 'positive' ? 'text-blue-400' :
                    'text-white'
                  }`}>
                    {activity.action}
                  </span>
                  <span className="text-white/40 text-sm">{activity.time}</span>
                </div>
                <div className="text-white/80 text-sm mt-1">{activity.detail}</div>
              </div>
              {activity.amount && (
                <div className="text-emerald-400 font-bold text-lg ml-4">{activity.amount}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Real-time Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Trending Now</h3>
          <div className="space-y-3">
            {[
              { product: "BBQ Supplies", views: 234, purchases: 67, trend: "+180%" },
              { product: "Ice Cream Tubs", views: 189, purchases: 45, trend: "+156%" },
              { product: "Energy Drinks", views: 167, purchases: 52, trend: "+142%" },
              { product: "Fresh Fruits", views: 145, purchases: 38, trend: "+98%" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex-1">
                  <div className="text-white font-medium">{item.product}</div>
                  <div className="text-white/60 text-sm mt-1">{item.views} views • {item.purchases} purchases</div>
                </div>
                <div className="text-emerald-400 font-bold flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {item.trend}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Customer Heatmap</h3>
          <div className="space-y-3">
            {[
              { zone: "Produce Section", activity: 92, customers: 34 },
              { zone: "Dairy Aisle", activity: 87, customers: 28 },
              { zone: "Checkout Area", activity: 78, customers: 23 },
              { zone: "Bakery", activity: 65, customers: 19 },
              { zone: "Beverages", activity: 58, customers: 16 },
            ].map((zone, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{zone.zone}</span>
                  <span className="text-white/60 text-sm">{zone.customers} shoppers</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      zone.activity >= 80 ? 'bg-emerald-400' :
                      zone.activity >= 60 ? 'bg-amber-400' :
                      'bg-blue-400'
                    }`}
                    style={{ width: `${zone.activity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
