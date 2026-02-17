"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Download, Calendar, Sun, Loader2, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface DemandForecast {
  product_name: string
  predictions: Array<{ date: string; demand: number }>
  trend: string
  growth_rate: number
  avg_daily_demand: number
}

interface DemandAlert {
  product_name: string
  peak_demand: number
  peak_date: string
  alert_level: string
}

export function DemandForecastView() {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([])
  const [alerts, setAlerts] = useState<DemandAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDemandForecast()
  }, [])

  const fetchDemandForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Adjust API URL based on environment
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${API_BASE}/api/forecasting/demand?days=30&top_n=5`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setForecasts(data.forecasts || [])
        setAlerts(data.high_demand_alerts || [])
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Forecast fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load forecasts')
    } finally {
      setLoading(false)
    }
  }

  const calculateWeekGrowth = () => {
    if (forecasts.length === 0) return '+18%'
    const avgGrowth = forecasts.reduce((sum, f) => sum + f.growth_rate, 0) / forecasts.length
    return `${avgGrowth > 0 ? '+' : ''}${(avgGrowth * 100).toFixed(0)}%`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Demand Forecast</h2>
          <p className="text-white/60 mt-1">AI-powered demand predictions for the next 30 days</p>
        </div>
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={() => window.print()}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Forecast
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60">Loading AI forecasts...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="backdrop-blur-xl bg-red-500/10 border border-red-400/30 rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-red-400 font-semibold">Error Loading Forecast</h3>
              <p className="text-white/60 text-sm mt-1">{error}</p>
              <p className="text-white/40 text-xs mt-2">
                Make sure models are trained: <code className="bg-white/10 px-2 py-1 rounded">python backend/forecasting/train_models.py</code>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Success State */}
      {!loading && !error && (
        <>
          {/* Weather Impact - Keep static for now */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Weather Impact Analysis</h3>
              <Sun className="h-6 w-6 text-amber-400" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-white/60 text-sm mb-2">This Week</div>
                <div className="text-white font-bold text-lg mb-1">☀️ Sunny</div>
                <div className="text-emerald-400 text-sm">+15% BBQ items</div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-white/60 text-sm mb-2">Next Week</div>
                <div className="text-white font-bold text-lg mb-1">🌧️ Rainy</div>
                <div className="text-blue-400 text-sm">+20% comfort foods</div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-white/60 text-sm mb-2">Impact Score</div>
                <div className="text-white font-bold text-2xl mb-1">High</div>
                <div className="text-amber-400 text-sm">Adjust inventory</div>
              </div>
            </div>
          </Card>

          {/* Forecast Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Next Week</span>
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{calculateWeekGrowth()}</div>
              <div className="text-emerald-400 text-sm">Projected Growth</div>
            </Card>

            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">High Demand Items</span>
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{alerts.length}</div>
              <div className="text-amber-400 text-sm">Products</div>
            </Card>

            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Stock Alert</span>
                <Calendar className="h-5 w-5 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{alerts.filter(a => a.alert_level === 'high').length}</div>
              <div className="text-red-400 text-sm">Items Need Restock</div>
            </Card>
          </div>

          {/* Real Forecast Data */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">30-Day Demand Forecast</h3>
            <div className="space-y-4">
              {forecasts.length > 0 ? (
                forecasts.map((forecast, idx) => {
                  const current = forecast.predictions[0]?.demand || 0
                  const predicted = forecast.avg_daily_demand
                  const trendIcon = forecast.trend === 'increasing' ? '📈' : forecast.trend === 'decreasing' ? '📉' : '➡️'
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex-1">
                        <div className="text-white font-medium flex items-center gap-2">
                          {trendIcon} {forecast.product_name}
                        </div>
                        <div className="text-white/60 text-sm mt-1">
                          Current avg: {current} units/day
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{predicted} units</div>
                        <div className={`text-sm ${forecast.growth_rate > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {forecast.growth_rate > 0 ? '+' : ''}{(forecast.growth_rate * 100).toFixed(0)}%
                        </div>
                        <div className="text-white/60 text-xs mt-1">
                          Trend: {forecast.trend}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-white/60 py-8">
                  No forecast data available. Train models first.
                </div>
              )}
            </div>
          </Card>

          {/* AI Recommendations */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border ${
                    alert.alert_level === 'high' 
                      ? 'bg-red-500/10 border-red-400/30' 
                      : 'bg-amber-500/10 border-amber-400/30'
                  }`}
                >
                  <div className={`font-medium mb-1 ${
                    alert.alert_level === 'high' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {alert.alert_level === 'high' ? '🔥' : '⚠️'} High Demand Alert
                  </div>
                  <div className="text-white/80 text-sm">
                    Increase inventory for "{alert.product_name}" - Peak of {alert.peak_demand} units expected on {alert.peak_date}
                  </div>
                </div>
              ))}
              
              {alerts.length === 0 && (
                <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                  <div className="text-blue-400 font-medium mb-1">💡 Optimization Tip</div>
                  <div className="text-white/80 text-sm">
                    No immediate high-demand alerts. Current inventory levels appear balanced.
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
