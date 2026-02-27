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

export interface CheapestProduct {
  product_id: number;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  cheapest_price: number;
  original_price?: number;
  discount?: number;
  store_name: string;
  retailer_id: number;
  deal_id: number;
  savings?: number;
}

export interface RetailerDeals {
  retailer_id: number;
  retailer_name: string;
  deal_title: string;
  start_date: string;
  end_date: string;
  dateRange: string;
  deal_count: number;
}

/**
 * Fetch cheapest products across all stores
 * @param limit Number of products to return (default: 20)
 * @param category Optional category filter
 * @returns Array of products with their cheapest prices
 */
export async function fetchCheapestProducts(
  limit: number = 20,
  category?: string,
  searchQuery?: string
): Promise<CheapestProduct[]> {
  const today = new Date().toISOString().split('T')[0];
  console.log(
    '🔍 Fetching cheapest products. Today:',
    today,
    'Category:',
    category || 'All',
    'Search:',
    searchQuery || '(none)'
  );
  
  let query = supabase
    .from('deals')
    .select(`
      *,
      products (
        product_id,
        name,
        brand,
        category,
        unit,
        image_url
      ),
      retailers (
        retailer_id,
        name
      )
    `)
    .gte('end_date', today);

  if (category && category !== 'All') {
    // Note: Can't filter by products.category in Supabase query, will filter in JS
  }

  const { data: deals, error } = await query.order('deal_price', { ascending: true });

  if (error) {
    console.error('❌ Error fetching cheapest products:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return [];
  }

  if (!deals || deals.length === 0) {
    console.log('⚠️ No deals found in database for date >= ', today);
    // Let's try without date filter to see if there's ANY data
    const { data: allDeals } = await supabase.from('deals').select('deal_id, end_date').limit(5);
    console.log('📊 Sample deals in database:', allDeals);
    return [];
  }

  console.log(`✅ Fetched ${deals.length} deals from database`);
  console.log('📦 First deal sample:', deals[0]);

  // Filter by category if specified
  let filteredDeals = deals;
  if (category && category !== 'All') {
    filteredDeals = deals.filter((deal: any) => 
      deal.products?.category?.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter by search query if specified
  const normalizedSearch = searchQuery?.trim().toLowerCase();
  if (normalizedSearch) {
    filteredDeals = filteredDeals.filter((deal: any) => {
      const name = deal.products?.name?.toLowerCase() || '';
      const brand = deal.products?.brand?.toLowerCase() || '';
      const categoryName = deal.products?.category?.toLowerCase() || '';
      const title = deal.title?.toLowerCase() || '';

      return (
        name.includes(normalizedSearch) ||
        brand.includes(normalizedSearch) ||
        categoryName.includes(normalizedSearch) ||
        title.includes(normalizedSearch)
      );
    });
  }

  // Group by product_id and find cheapest price for each
  const productMap = new Map<number, CheapestProduct>();

  filteredDeals.forEach((deal: any) => {
    if (!deal.products || !deal.products.product_id) return;

    const productId = deal.products.product_id;
    const storeName = deal.retailers?.name || 'Unknown Store';

    if (!productMap.has(productId)) {
      // Calculate savings by comparing against other prices for this product
      const allPricesForProduct = filteredDeals
        .filter((d: any) => d.product_id === productId)
        .map((d: any) => d.deal_price);
      
      const avgPrice = allPricesForProduct.length > 1 
        ? allPricesForProduct.reduce((a: number, b: number) => a + b, 0) / allPricesForProduct.length
        : deal.original_price || deal.deal_price;
      
      const savings = avgPrice - deal.deal_price;

      productMap.set(productId, {
        product_id: productId,
        name: deal.products.name,
        brand: deal.products.brand,
        category: deal.products.category,
        unit: deal.products.unit,
        image_url: deal.products.image_url,
        cheapest_price: deal.deal_price,
        original_price: deal.original_price,
        discount: deal.discount,
        store_name: storeName,
        retailer_id: deal.retailer_id,
        deal_id: deal.deal_id,
        savings: savings > 0 ? savings : undefined
      });
    }
  });

  // Convert to array and sort by price (lowest first)
  const cheapestProducts = Array.from(productMap.values())
    .sort((a, b) => a.cheapest_price - b.cheapest_price)
    .slice(0, limit);

  console.log(`✅ Returning ${cheapestProducts.length} cheapest products`);
  return cheapestProducts;
}

/**
 * Fetch deals grouped by retailer/supermarket
 * @returns Array of retailer deals with counts
 */
export async function fetchDealsByRetailer(): Promise<RetailerDeals[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      *,
      retailers (
        retailer_id,
        name
      )
    `)
    .gte('end_date', today)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('❌ Error fetching retailer deals:', error);
    return [];
  }

  if (!deals || deals.length === 0) {
    console.log('⚠️ No deals found for retailers');
    return [];
  }

  console.log(`✅ Fetched ${deals.length} deals for retailer grouping`);

  // Group by retailer and date range
  const retailerMap = new Map<string, RetailerDeals>();

  deals.forEach((deal: any) => {
    if (!deal.retailers) return;

    const key = `${deal.retailer_id}|${deal.start_date}|${deal.end_date}`;
    
    if (!retailerMap.has(key)) {
      const retailerName = deal.retailers.name;
      retailerMap.set(key, {
        retailer_id: deal.retailer_id,
        retailer_name: retailerName,
        deal_title: `${retailerName} Weekly Specials`,
        start_date: deal.start_date,
        end_date: deal.end_date,
        deal_count: 0,
        dateRange: formatDateRange(deal.start_date, deal.end_date)
      });
    }
    
    const group = retailerMap.get(key)!;
    group.deal_count++;
  });

  // Convert to array and sort by end date (expiring soon first)
  const result = Array.from(retailerMap.values()).sort((a, b) => 
    new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
  );

  console.log(`✅ Returning ${result.length} retailer deal groups`);
  return result;
}

export interface Supermarket {
  supermarket_id: number;
  name: string;
  logo_url?: string;
}

export interface Retailer {
  retailer_id: number;
  name: string;
}

export interface ProductDealComparison extends DealWithProduct {
  retailers?: Retailer;
}

/**
 * Fetch all active deals for a specific product across all supermarkets
 * @param productId The product ID to fetch deals for
 * @returns Array of deals sorted by price (cheapest first)
 */
export async function fetchAllDealsForProduct(productId: number): Promise<ProductDealComparison[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
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
    .eq('product_id', productId)
    .gte('end_date', today)
    .order('deal_price', { ascending: true });

  if (error) {
    console.error('❌ Error fetching product deals:', error);
    return [];
  }

  console.log(`✅ Found ${data?.length || 0} deals for product ${productId}`);
  return (data || []) as ProductDealComparison[];
}

/**
 * Fetch unique categories from the products table
 * @returns Array of category names starting with 'All'
 */
export async function fetchCategories(): Promise<string[]> {
  console.log('🔍 Fetching categories from products table');
  
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    console.error('❌ Error fetching categories:', error);
    return ['All'];
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No categories found in database');
    return ['All'];
  }

  // Extract unique categories and sort alphabetically
  const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))].sort();
  
  // Add 'All' at the beginning
  const categories = ['All', ...uniqueCategories];
  
  console.log(`✅ Found ${uniqueCategories.length} unique categories:`, uniqueCategories);
  return categories;
}
