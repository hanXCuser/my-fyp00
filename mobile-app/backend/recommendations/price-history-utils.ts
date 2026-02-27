import { supabase } from '../scraping/supabase-node';

/**
 * Fetch the last N price history entries for a product (optionally by supermarket)
 * @param productId Product ID
 * @param supermarketId (optional) Supermarket ID
 * @param limit Number of price history entries to fetch (default: 12)
 */
export async function getLastNPrices(productId: number, supermarketId?: number, limit = 12) {
  let query = supabase
    .from('price_history')
    .select('old_price, collected_at')
    .eq('product_id', productId)
    .order('collected_at', { ascending: false })
    .limit(limit);

  if (supermarketId) {
    query = query.eq('supermarket_id', supermarketId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching price history:', error);
    return [];
  }
  return data || [];
}
