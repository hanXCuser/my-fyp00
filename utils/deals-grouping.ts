import { supabase } from '@/lib/supabase';

export interface Deal {
  deal_id: number;
  product_id: number;
  retailer_id: number;
  title?: string;
  description?: string;
  deal_price: number;
  original_price?: number;
  discount?: number;
  start_date: string;
  end_date: string;
  created_at?: string;
  retailers?: {
    retailer_id: number;
    name: string;
  };
}

export interface Product {
  product_id: number;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  description?: string;
}

export interface DealWithProduct extends Deal {
  products?: Product;
}

export interface GroupedDeals {
  dateRange: string;
  startDate: string;
  endDate: string;
  dealCount: number;
  deals: DealWithProduct[];
}

/**
 * Fetch all active deals grouped by their valid date range
 * @param limit Optional limit per group (default: no limit)
 * @returns Array of grouped deals sorted by expiration date (closest first)
 */
export async function fetchDealsGroupedByDateRange(limit?: number): Promise<GroupedDeals[]> {
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch all active deals with product and retailer information
  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      *,
      products (
        product_id,
        name,
        brand,
        category,
        unit,
        image_url,
        description
      ),
      retailers (
        retailer_id,
        name
      )
    `)
    .gte('end_date', today)
    .order('start_date', { ascending: false })
    .order('end_date', { ascending: false });

  if (error) {
    console.error('❌ Error fetching deals:', error);
    throw error;
  }

  if (!deals || deals.length === 0) {
    return [];
  }

  // Group deals by date range
  const groupedMap = new Map<string, GroupedDeals>();

  deals.forEach((deal: any) => {
    const key = `${deal.start_date}|${deal.end_date}`;
    
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        dateRange: formatDateRange(deal.start_date, deal.end_date),
        startDate: deal.start_date,
        endDate: deal.end_date,
        dealCount: 0,
        deals: []
      });
    }
    
    const group = groupedMap.get(key)!;
    
    // Apply limit if specified
    if (!limit || group.deals.length < limit) {
      group.deals.push(deal);
    }
    group.dealCount++;
  });

  // Convert map to array and sort by end date (closest expiry first)
  return Array.from(groupedMap.values()).sort((a, b) => {
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  });
}

/**
 * Format date range for display
 * @param startDate ISO date string
 * @param endDate ISO date string
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  
  // Check if it's the same month and year
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const monthYear = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${start.getDate()}-${end.getDate()} ${monthYear}`;
  }
  
  // Check if it's the same year
  if (start.getFullYear() === end.getFullYear()) {
    const startMonth = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startMonth} - ${endMonth}, ${start.getFullYear()}`;
  }
  
  const startFormatted = start.toLocaleDateString('en-US', options);
  const endFormatted = end.toLocaleDateString('en-US', options);
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Fetch deals for a specific date range
 * @param startDate Start date in ISO format (YYYY-MM-DD)
 * @param endDate End date in ISO format (YYYY-MM-DD)
 * @returns Array of deals for the specified date range
 */
export async function fetchDealsByDateRange(startDate: string, endDate: string): Promise<DealWithProduct[]> {
  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      *,
      products (
        product_id,
        name,
        brand,
        category,
        unit,
        image_url,
        description
      ),
      retailers (
        retailer_id,
        name
      )
    `)
    .eq('start_date', startDate)
    .eq('end_date', endDate)
    .order('deal_price', { ascending: true });

  if (error) {
    console.error('❌ Error fetching deals:', error);
    throw error;
  }

  return (deals as DealWithProduct[]) || [];
}
