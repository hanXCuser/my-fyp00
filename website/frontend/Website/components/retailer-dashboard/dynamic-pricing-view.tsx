"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, TrendingUp, TrendingDown, DollarSign, Sun } from "lucide-react"

export function DynamicPricingView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Dynamic Pricing</h2>
          <p className="text-white/60 mt-1">AI-powered real-time price optimization</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
            <Zap className="mr-1 h-3 w-3" />
            Auto-pricing Active
          </Badge>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            Configure Rules
          </Button>
        </div>
      </div>

      {/* Weather Impact Alert */}
      <Card className="backdrop-blur-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-3xl p-6">
        <div className="flex items-center space-x-4">
          <Sun className="h-8 w-8 text-amber-400" />
          <div className="flex-1">
            <div className="text-white font-semibold mb-1">Weather Impact: High Temperature</div>
            <div className="text-white/80 text-sm">Recommended: Increase cold beverage prices by 8-12% & ice cream by 10-15%</div>
          </div>
          <Button className="bg-amber-500/20 hover:bg-amber-500/30 text-white border border-amber-400/30">
            Apply Suggestion
          </Button>
        </div>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Revenue Impact</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">+$47.2K</div>
          <div className="text-emerald-400 text-sm">+23% vs static pricing</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Margin Improvement</span>
            <DollarSign className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">+8.4%</div>
          <div className="text-blue-400 text-sm">Optimized profitability</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Price Changes</span>
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">142</div>
          <div className="text-amber-400 text-sm">Today</div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Conversion Rate</span>
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">34.8%</div>
          <div className="text-purple-400 text-sm">+5.2% improvement</div>
        </Card>
      </div>

      {/* Active Price Adjustments */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Active Price Adjustments</h3>
        <div className="space-y-3">
          {[
            { product: "Organic Milk 1L", old: 4.99, new: 5.49, change: "+10%", reason: "High demand, low competition", impact: "+$2.4K", trend: "up" },
            { product: "Ice Cream Tubs", old: 6.99, new: 5.99, change: "-14%", reason: "Competitor price match", impact: "+$1.8K", trend: "down" },
            { product: "Premium Coffee", old: 12.99, new: 14.49, change: "+12%", reason: "Low stock, premium positioning", impact: "+$3.2K", trend: "up" },
            { product: "Energy Drinks", old: 2.49, new: 2.99, change: "+20%", reason: "Peak hours surge pricing", impact: "+$890", trend: "up" },
            { product: "Bread Loaves", old: 3.49, new: 2.99, change: "-14%", reason: "Expiry date approaching", impact: "-$420", trend: "down" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex-1">
                <div className="text-white font-medium mb-1">{item.product}</div>
                <div className="text-white/60 text-sm">{item.reason}</div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-white/40 text-sm line-through">${item.old}</div>
                  <div className="text-white font-semibold text-lg">${item.new}</div>
                </div>
                <div className="text-right">
                  <div className={`${item.trend === 'up' ? 'text-emerald-400' : 'text-red-400'} font-medium flex items-center`}>
                    {item.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    {item.change}
                  </div>
                  <div className="text-white/60 text-sm">{item.impact}</div>
                  <div className="text-white/40 text-xs mt-1">Predicted: +{Math.floor(Math.random() * 30 + 10)}% sales</div>
                </div>
                <Button size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white border border-emerald-400/30">
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pricing Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Pricing Rules</h3>
          <div className="space-y-3">
            {[
              { rule: "Competitive Pricing", status: "Active", products: 234 },
              { rule: "Time-based Pricing", status: "Active", products: 89 },
              { rule: "Demand-based Surge", status: "Active", products: 156 },
              { rule: "Inventory Clearance", status: "Paused", products: 23 },
            ].map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white font-medium">{rule.rule}</div>
                  <div className="text-white/60 text-sm">{rule.products} products</div>
                </div>
                <Badge className={rule.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/60"}>
                  {rule.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Optimization Insights</h3>
          <div className="space-y-3">
            <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-xl">
              <div className="text-emerald-400 font-medium mb-1">💰 Revenue Opportunity</div>
              <div className="text-white/80 text-sm">Increase prices on 12 high-demand items for +$8.4K revenue</div>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
              <div className="text-blue-400 font-medium mb-1">📊 Price Elasticity Alert</div>
              <div className="text-white/80 text-sm">5 products showing low price sensitivity - safe to increase 8-12%</div>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-400/30 rounded-xl">
              <div className="text-amber-400 font-medium mb-1">⚡ Competitor Movement</div>
              <div className="text-white/80 text-sm">3 nearby stores dropped prices - review matching strategy</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
