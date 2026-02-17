"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DollarSign, ChevronRight, Undo2, Zap } from "lucide-react"
import { useDashboard } from "./DashboardContext"

export function PricingView() {
  const { 
    pricingSuggestions, 
    pricingHistory, 
    handleApplyPricing, 
    handleApplyAllPricing, 
    handleUndoPricing,
    showNotification
  } = useDashboard()

  return (
    <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">AI Pricing Recommendations</h3>
          <p className="text-white/60 text-sm">Dynamic pricing suggestions based on demand forecasting</p>
        </div>
        <div className="flex items-center space-x-3">
          {pricingHistory.length > 0 && (
            <Button 
              size="sm" 
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
              onClick={handleUndoPricing}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Undo
            </Button>
          )}
          <Button 
            size="sm" 
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-white"
            onClick={handleApplyAllPricing}
          >
            <Zap className="mr-2 h-4 w-4 text-emerald-400" />
            Apply All
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {pricingSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-5 rounded-xl border transition-all duration-300 ${
              suggestion.applied 
                ? "bg-emerald-500/10 border-emerald-400/30" 
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  suggestion.applied ? "bg-emerald-500/20" : "bg-amber-500/20"
                }`}>
                  <DollarSign className={`h-6 w-6 ${suggestion.applied ? "text-emerald-400" : "text-amber-400"}`} />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{suggestion.name}</p>
                  <p className="text-white/60 text-sm">{suggestion.reason}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <p className="text-white/60 text-xs uppercase">Current</p>
                  <p className="text-white text-xl font-bold">${suggestion.current.toFixed(2)}</p>
                </div>
                
                <ChevronRight className="h-6 w-6 text-emerald-400" />
                
                <div className="text-center">
                  <p className="text-emerald-400 text-xs uppercase">Suggested</p>
                  <p className="text-emerald-400 text-xl font-bold">${suggestion.suggested.toFixed(2)}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-white/60 text-xs uppercase">Impact</p>
                  <p className="text-emerald-400 text-xl font-bold">{suggestion.impact}</p>
                </div>
                
                <Button
                  size="sm"
                  className={suggestion.applied 
                    ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                    : "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-400"
                  }
                  onClick={() => handleApplyPricing(index)}
                >
                  {suggestion.applied ? (
                    <>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Undo
                    </>
                  ) : (
                    "Apply"
                  )}
                </Button>
                {!suggestion.applied && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-white"
                    onClick={() => showNotification('Opening custom price adjustment...')}
                  >
                    Adjust Price
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
