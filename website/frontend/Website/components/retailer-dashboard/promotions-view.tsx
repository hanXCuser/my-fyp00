"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tag, ShoppingCart, DollarSign, TrendingUp, Plus, Percent, Zap } from "lucide-react"
import { useDashboard } from "./DashboardContext"

export function PromotionsView() {
  const { campaigns, showNotification, setShowCreateCampaignDialog } = useDashboard()

  return (
    <div className="space-y-6">
      {/* Promotion Stats */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { title: "Active Campaigns", value: "8", icon: Tag, color: "text-emerald-400" },
          { title: "Total Redemptions", value: "3,247", icon: ShoppingCart, color: "text-blue-400" },
          { title: "Revenue Impact", value: "+$47.2K", icon: DollarSign, color: "text-amber-400" },
          { title: "Avg. ROI", value: "340%", icon: TrendingUp, color: "text-cyan-400" },
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

      {/* Active Campaigns */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Active Campaigns</h3>
          <Button 
            size="sm" 
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-white"
            onClick={() => setShowCreateCampaignDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-emerald-400" />
            Create Campaign
          </Button>
        </div>

        <div className="space-y-4">
          {campaigns.map((promo, index) => (
            <div
              key={index}
              className="p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    promo.status === "Active" ? "bg-emerald-500/20" : "bg-white/10"
                  }`}>
                    <Percent className={`h-6 w-6 ${
                      promo.status === "Active" ? "text-emerald-400" : "text-white/60"
                    }`} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{promo.name}</p>
                    <p className="text-white/60 text-sm">{promo.discount}</p>
                  </div>
                </div>
                <Badge
                  className={`text-xs px-3 py-1 ${
                    promo.status === "Active"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/30"
                      : "bg-white/10 text-white/60 border-white/20"
                  }`}
                >
                  {promo.status}
                </Badge>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-3">
                <div>
                  <p className="text-white/60 text-xs">Sales</p>
                  <p className="text-white font-semibold">{promo.sales}</p>
                  <p className="text-emerald-400 text-xs">+{Math.floor(Math.random() * 20 + 5)}% predicted</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Redemptions</p>
                  <p className="text-white font-semibold">{promo.redemptions}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">ROI</p>
                  <p className="text-emerald-400 font-semibold">{promo.roi}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Duration</p>
                  <p className="text-white/80">{promo.endDate}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Performance</p>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full"
                      style={{ width: `${promo.performance}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Campaign Ideas */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-6 w-6 text-amber-400" />
          <h3 className="text-xl font-semibold text-white">AI Campaign Suggestions</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              idea: "Back-to-School Supplies Bundle", 
              discount: "20% OFF", 
              target: "Families with children",
              potential: "+$8.5K",
              confidence: 87
            },
            { 
              idea: "Organic Products Week", 
              discount: "15% OFF", 
              target: "Health-conscious shoppers",
              potential: "+$6.2K",
              confidence: 82
            },
            { 
              idea: "Evening Shopper Special", 
              discount: "10% OFF after 7PM", 
              target: "Late shoppers",
              potential: "+$4.8K",
              confidence: 75
            },
            { 
              idea: "Buy Local Campaign", 
              discount: "25% OFF local brands", 
              target: "Community supporters",
              potential: "+$7.3K",
              confidence: 79
            },
          ].map((idea, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex justify-between items-start mb-2">
                <p className="text-white font-semibold">{idea.idea}</p>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30 text-xs">
                  {idea.discount}
                </Badge>
              </div>
              <p className="text-white/60 text-sm mb-3">{idea.target}</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/60">Potential Revenue</p>
                  <p className="text-emerald-400 font-semibold">{idea.potential}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">AI Confidence</p>
                  <p className="text-cyan-400 font-semibold">{idea.confidence}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
