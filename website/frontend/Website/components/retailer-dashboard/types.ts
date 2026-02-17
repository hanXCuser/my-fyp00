export interface Product {
  name: string
  sku: string
  stock: number
  price: number
  status: string
  trend: string
}

export interface PricingSuggestion {
  name: string
  current: number
  suggested: number
  reason: string
  impact: string
  applied: boolean
}

export interface Campaign {
  name: string
  discount: string
  sales: string
  redemptions: number
  roi: string
  status: string
  endDate: string
  performance: number
}
