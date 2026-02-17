"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, TrendingUp } from "lucide-react"
import { useDashboard } from "./DashboardContext"

export function ReportsView() {
  const { handleExport } = useDashboard()

  const reports = [
    {
      title: "Sales Performance Report",
      description: "Comprehensive sales analysis with trends and comparisons",
      period: "Last 30 Days",
      size: "2.4 MB",
      date: "Jan 20, 2026",
      icon: TrendingUp,
      color: "emerald"
    },
    {
      title: "Inventory Movement Report",
      description: "Stock level changes, turnover rates, and restock recommendations",
      period: "Last Quarter",
      size: "1.8 MB",
      date: "Jan 15, 2026",
      icon: FileText,
      color: "blue"
    },
    {
      title: "Consumer Behavior Report",
      description: "Shopping patterns, preferences, and demographic insights",
      period: "Last Month",
      size: "3.1 MB",
      date: "Jan 10, 2026",
      icon: FileText,
      color: "purple"
    },
    {
      title: "Pricing Analytics Report",
      description: "Price elasticity, competitor analysis, and optimization suggestions",
      period: "Last 60 Days",
      size: "1.5 MB",
      date: "Jan 5, 2026",
      icon: FileText,
      color: "amber"
    },
    {
      title: "Promotion Effectiveness Report",
      description: "Campaign performance, ROI analysis, and engagement metrics",
      period: "Last Quarter",
      size: "2.2 MB",
      date: "Jan 1, 2026",
      icon: FileText,
      color: "pink"
    },
    {
      title: "Store Performance Report",
      description: "Multi-location analysis with comparison and benchmarking",
      period: "Last Month",
      size: "4.3 MB",
      date: "Dec 28, 2025",
      icon: FileText,
      color: "cyan"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Reports</h2>
          <p className="text-white/60 mt-1">Access and download comprehensive business reports</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => handleExport('custom-report')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
          <div className="text-white/60 text-sm mb-1">Total Reports</div>
          <div className="text-2xl font-bold text-white">147</div>
        </Card>
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
          <div className="text-white/60 text-sm mb-1">This Month</div>
          <div className="text-2xl font-bold text-white">23</div>
        </Card>
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
          <div className="text-white/60 text-sm mb-1">Scheduled</div>
          <div className="text-2xl font-bold text-white">8</div>
        </Card>
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
          <div className="text-white/60 text-sm mb-1">Data Size</div>
          <div className="text-2xl font-bold text-white">15.3 GB</div>
        </Card>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, idx) => (
          <Card key={idx} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${report.color}-500/20`}>
                <report.icon className={`h-6 w-6 text-${report.color}-400`} />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => handleExport(report.title.toLowerCase().replace(/ /g, '-'))}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">{report.title}</h3>
            <p className="text-white/60 text-sm mb-4">{report.description}</p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">{report.period}</span>
              <span className="text-white/40">{report.size}</span>
            </div>
            <div className="text-white/40 text-xs mt-2">Last updated: {report.date}</div>
          </Card>
        ))}
      </div>

      {/* Scheduled Reports */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Scheduled Reports</h3>
        <div className="space-y-3">
          {[
            { name: "Weekly Sales Summary", frequency: "Every Monday 9:00 AM", next: "Jan 27, 2026" },
            { name: "Inventory Status", frequency: "Daily 6:00 AM", next: "Jan 21, 2026" },
            { name: "Monthly Performance Review", frequency: "1st of Every Month", next: "Feb 1, 2026" },
          ].map((scheduled, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <div className="text-white font-medium">{scheduled.name}</div>
                <div className="text-white/60 text-sm mt-1">{scheduled.frequency}</div>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-sm">Next Run</div>
                <div className="text-white font-medium">{scheduled.next}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
