"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus } from "lucide-react"
import { useDashboard } from "./DashboardContext"

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCampaignDialog({ open, onOpenChange }: CreateCampaignDialogProps) {
  const { campaigns, setCampaigns, showNotification } = useDashboard()
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    discount: "",
    duration: 7
  })

  const handleCreateNewCampaign = () => {
    if (!newCampaign.name || !newCampaign.discount || newCampaign.duration <= 0) {
      showNotification("Please fill in all campaign fields correctly")
      return
    }

    const campaignToAdd = {
      name: newCampaign.name,
      discount: newCampaign.discount,
      sales: "$0",
      redemptions: 0,
      roi: "+0%",
      status: "Active",
      endDate: `${newCampaign.duration} days left`,
      performance: 0
    }

    setCampaigns([campaignToAdd, ...campaigns])
    showNotification(`Created campaign: ${campaignToAdd.name}`)
    onOpenChange(false)
    setNewCampaign({ name: "", discount: "", duration: 7 })
  }

  const handleClose = () => {
    onOpenChange(false)
    setNewCampaign({ name: "", discount: "", duration: 7 })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Create New Campaign</h3>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">Campaign Name</label>
            <Input
              type="text"
              placeholder="e.g., Spring Sale 2026"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">Discount</label>
            <Input
              type="text"
              placeholder="e.g., 20% OFF or Buy 1 Get 1"
              value={newCampaign.discount}
              onChange={(e) => setNewCampaign({ ...newCampaign, discount: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">Duration (days)</label>
            <Input
              type="number"
              placeholder="7"
              value={newCampaign.duration || ""}
              onChange={(e) => setNewCampaign({ ...newCampaign, duration: parseInt(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleCreateNewCampaign}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
