// Database types matching Supabase schema
export interface Product {
  product_id?: number;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  description?: string;
  created_at?: string;
}

export interface Deal {
  deal_id?: number;
  product_id?: number;
  supermarket_id: number;
  retailer_id: number;
  pamphlet_id?: number;
  title: string;
  description?: string;
  deal_price: number;
  discount?: number;
  start_date: string;
  end_date: string;
  source: string;
  created_at?: string;
}

export interface Retailer {
  retailer_id?: number;
  name: string;
  description?: string;
  website_url: string;
}

export interface Supermarket {
  supermarket_id?: number;
  retailer_id: number;
  name: string;
  location?: string;
  contact_no?: string;
  logo_url?: string;
  opening_hours?: any;
  created_at?: string;
}

export interface ScraperConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
}

export interface ScrapedProduct {
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  url?: string;
}

export interface ScraperResult {
  success: boolean;
  products: ScrapedProduct[];
  deals: Deal[];
  errors: string[];
  retailer: string;
  scrapedAt: Date;
}
