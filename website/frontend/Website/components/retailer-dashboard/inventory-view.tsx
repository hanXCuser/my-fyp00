"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, TrendingDown } from "lucide-react"
import { useDashboard } from "./DashboardContext"

export function InventoryView() {
  const { inventory, setInventory, showNotification, filteredInventory, setShowAddProductDialog } = useDashboard()

  return (
    <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Inventory Management</h3>
        <Button 
          size="sm" 
          className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-white"
          onClick={() => setShowAddProductDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4 text-emerald-400" />
          Add Product
        </Button>
      </div>

      <div className="space-y-3">
        {filteredInventory.length > 0 ? (
          filteredInventory.map((product, displayIndex) => {
            const actualIndex = inventory.findIndex(p => p.sku === product.sku)
            return (
              <div
                key={actualIndex}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    product.status === "In Stock" ? "bg-emerald-500/20" : product.status === "Low Stock" ? "bg-amber-500/20" : "bg-red-500/20"
                  }`}>
                    <Package className={`h-5 w-5 ${
                      product.status === "In Stock" ? "text-emerald-400" : product.status === "Low Stock" ? "text-amber-400" : "text-red-400"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-white/60">SKU: {product.sku}</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="font-bold text-white">{product.stock}</p>
                    <p className="text-xs text-white/60">units</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="font-bold text-white">${product.price.toFixed(2)}</p>
                    <p className={`text-xs ${product.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{product.trend}</p>
                  </div>
                  <Badge className={`text-xs ${
                    product.status === "In Stock"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/30"
                      : product.status === "Low Stock"
                        ? "bg-amber-500/20 text-amber-400 border-amber-400/30"
                        : "bg-red-500/20 text-red-400 border-red-400/30"
                  }`}>
                    {product.status}
                  </Badge>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-emerald-400 hover:bg-emerald-500/20"
                      onClick={() => {
                        const updated = [...inventory]
                        updated[actualIndex].stock += 50
                        if (updated[actualIndex].stock > 100) updated[actualIndex].status = "In Stock"
                        else if (updated[actualIndex].stock > 30) updated[actualIndex].status = "Low Stock"
                        setInventory(updated)
                        showNotification(`Added 50 units to ${updated[actualIndex].name}`)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-500/20"
                      onClick={() => {
                        const productName = inventory[actualIndex].name
                        const updated = inventory.filter((_, i) => i !== actualIndex)
                        setInventory(updated)
                        showNotification(`Removed ${productName} from inventory`)
                      }}
                    >
                      <TrendingDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-white/40 mx-auto mb-3" />
            <p className="text-white/60">No products found matching your search</p>
          </div>
        )}
      </div>
    </Card>
  )
}
