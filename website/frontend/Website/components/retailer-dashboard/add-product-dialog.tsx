"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus } from "lucide-react"
import { useDashboard } from "./DashboardContext"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddProductDialog({ open, onOpenChange }: AddProductDialogProps) {
  const { inventory, setInventory, showNotification } = useDashboard()
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    stock: 100,
    price: 0
  })

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.sku || newProduct.price <= 0) {
      showNotification("Please fill in all product fields correctly")
      return
    }
    
    const productToAdd = {
      name: newProduct.name,
      sku: newProduct.sku,
      stock: newProduct.stock,
      price: newProduct.price,
      status: newProduct.stock > 100 ? "In Stock" : newProduct.stock > 30 ? "Low Stock" : "Critical",
      trend: "+0%"
    }
    
    setInventory([...inventory, productToAdd])
    showNotification(`Added ${productToAdd.name} to inventory`)
    onOpenChange(false)
    setNewProduct({ name: "", sku: "", stock: 100, price: 0 })
  }

  const handleClose = () => {
    onOpenChange(false)
    setNewProduct({ name: "", sku: "", stock: 100, price: 0 })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Add New Product</h3>
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
            <label className="text-sm font-medium text-white/80 mb-2 block">Product Name</label>
            <Input
              type="text"
              placeholder="e.g., Organic Apple Juice"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">SKU</label>
            <Input
              type="text"
              placeholder="e.g., BEV-042"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">Stock</label>
              <Input
                type="number"
                placeholder="100"
                value={newProduct.stock || ""}
                onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">Price ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="9.99"
                value={newProduct.price || ""}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleAddProduct}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
