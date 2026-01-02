import { supabase } from '../../scraping/supabase-node';

/**
 * GET /api/deals/discounts
 * Get deals sorted by discount percentage (best deals first)
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - min_discount: minimum discount % (default: 10)
 * - category: filter by category
 * - retailer_id: filter by retailer
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Filters
    const minDiscount = parseInt(searchParams.get('min_discount') || '10');
    const category = searchParams.get('category');
    const retailerId = searchParams.get('retailer_id');

    // Get current date for active deals only
    const today = new Date().toISOString().split('T')[0];

    // Build query - only deals with discounts
    let query = supabase
      .from('deals')
      .select(`
        deal_id,
        title,
        description,
        deal_price,
        original_price,
        discount,
        start_date,
        end_date,
        product:products (
          product_id,
          name,
          brand,
          category,
          unit,
          image_url
        ),
        supermarket:supermarkets (
          supermarket_id,
          branch_name,
          city
        ),
        retailer:retailers (
          retailer_id,
          name
        )
      `, { count: 'exact' })
      .lte('start_date', today)
      .gte('end_date', today)
      .not('discount', 'is', null)
      .gte('discount', minDiscount)
      .order('discount', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('products.category', category);
    }

    if (retailerId) {
      query = query.eq('retailer_id', parseInt(retailerId));
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return Response.json(
        { error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return Response.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
