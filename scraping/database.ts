import { supabase } from './supabase-node';
import { Deal, Product, ScrapedProduct } from './types';

export class DatabaseService {
  /**
   * Get or create retailer by name
   */
  async getOrCreateRetailer(name: string, website_url: string, description?: string): Promise<number> {
    // Check if retailer exists
    const { data: existing, error: fetchError } = await supabase
      .from('retailers')
      .select('retailer_id')
      .eq('name', name)
      .single();

    if (existing) {
      return existing.retailer_id;
    }

    // Create new retailer
    const { data, error } = await supabase
      .from('retailers')
      .insert({ name, description, website_url })
      .select('retailer_id')
      .single();

    if (error) throw error;
    return data.retailer_id;
  }

  /**
   * Get or create product by name and brand
   * Checks for duplicates before creating
   */
  async getOrCreateProduct(product: Omit<Product, 'product_id' | 'created_at'>): Promise<number> {
    // Build query to check if product exists
    let query = supabase
      .from('products')
      .select('product_id')
      .eq('name', product.name);

    // Handle brand comparison (null, undefined, or value)
    if (product.brand) {
      query = query.eq('brand', product.brand);
    } else {
      query = query.is('brand', null);
    }

    const { data: existing, error: fetchError } = await query.maybeSingle();

    if (existing) {
      console.log(`✓ Product already exists: ${product.name} (ID: ${existing.product_id})`);
      return existing.product_id;
    }

    // Create new product
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select('product_id')
      .single();

    if (error) throw error;
    console.log(`✓ Created new product: ${product.name} (ID: ${data.product_id})`);
    return data.product_id;
  }

  /**
   * Get supermarket by retailer and branch name
   * Returns the first active branch if branch_name not specified
   */
  async getSupermarket(retailer_id: number, branch_name?: string): Promise<number | null> {
    let query = supabase
      .from('supermarkets')
      .select('supermarket_id')
      .eq('retailer_id', retailer_id)
      .eq('is_active', true);

    if (branch_name) {
      query = query.eq('branch_name', branch_name);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) return null;
    return data.supermarket_id;
  }

  /**
   * Create or update deal
   * Prevents duplicate deals for same product/supermarket/dates
   */
  async upsertDeal(deal: Omit<Deal, 'deal_id' | 'created_at'>): Promise<number> {
    // Check if deal exists (same product, supermarket, and date range)
    const { data: existing, error: fetchError } = await supabase
      .from('deals')
      .select('deal_id, deal_price')
      .eq('product_id', deal.product_id)
      .eq('supermarket_id', deal.supermarket_id)
      .eq('start_date', deal.start_date)
      .eq('end_date', deal.end_date)
      .maybeSingle();

    if (existing) {
      // Update existing deal if price changed
      if (existing.deal_price !== deal.deal_price) {
        const { data, error } = await supabase
          .from('deals')
          .update(deal)
          .eq('deal_id', existing.deal_id)
          .select('deal_id')
          .single();

        if (error) throw error;
        console.log(`✓ Updated existing deal (ID: ${data.deal_id}) - Price changed from R${existing.deal_price} to R${deal.deal_price}`);
        return data.deal_id;
      } else {
        console.log(`✓ Deal already exists (ID: ${existing.deal_id}) - No changes needed`);
        return existing.deal_id;
      }
    }

    // Create new deal
    const { data, error } = await supabase
      .from('deals')
      .insert(deal)
      .select('deal_id')
      .single();

    if (error) throw error;
    console.log(`✓ Created new deal (ID: ${data.deal_id}) at R${deal.deal_price}`);
    return data.deal_id;
  }

  /**
   * Batch insert deals
   */
  async batchInsertDeals(deals: Omit<Deal, 'deal_id' | 'created_at'>[]): Promise<number> {
    if (deals.length === 0) return 0;

    const { data, error } = await supabase
      .from('deals')
      .insert(deals)
      .select('deal_id');

    if (error) throw error;
    return data?.length || 0;
  }

  /**
   * Save scraped products and create deals
   */
  async saveScrapedData(
    retailer_id: number,
    supermarket_id: number,
    scrapedProducts: ScrapedProduct[],
    source: string,
    startDate: string,
    endDate: string
  ): Promise<{ productsCreated: number; dealsCreated: number }> {
    let productsCreated = 0;
    let dealsCreated = 0;

    for (const scraped of scrapedProducts) {
      try {
        // Create or get product
        const product_id = await this.getOrCreateProduct({
          name: scraped.name,
          brand: scraped.brand,
          category: scraped.category,
          unit: scraped.unit,
          image_url: scraped.image_url,
          description: scraped.description,
        });

        productsCreated++;

        // Create deal
        const deal: Omit<Deal, 'deal_id' | 'created_at'> = {
          product_id,
          supermarket_id,
          retailer_id,
          title: scraped.name,
          description: scraped.description,
          deal_price: scraped.price,
          original_price: scraped.originalPrice,
          discount: scraped.discount,
          start_date: startDate,
          end_date: endDate,
          source,
        };

        await this.upsertDeal(deal);
        dealsCreated++;
      } catch (error) {
        console.error(`Failed to save product ${scraped.name}:`, error);
      }
    }

    return { productsCreated, dealsCreated };
  }

  /**
   * Get all active deals for a retailer
   */
  async getActiveDeals(retailer_id: number): Promise<Deal[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('retailer_id', retailer_id)
      .lte('start_date', today)
      .gte('end_date', today);

    if (error) throw error;
    return data || [];
  }
}
