import { supabase } from '../../scraping/supabase-node';

/**
 * GET /api/deals/all
 * Get all active deals with filtering, search, and pagination
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - category: filter by category
 * - retailer_id: filter by retailer
 * - min_price: minimum deal price
 * - max_price: maximum deal price
 * - min_discount: minimum discount percentage
 * - search: search in product name/title
 * - sort: 'price_asc', 'price_desc', 'discount_desc', 'newest' (default: 'newest')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const retailerId = searchParams.get('retailer_id');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const minDiscount = searchParams.get('min_discount');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    // Get current date for active deals only
    const today = new Date().toISOString().split('T')[0];

    // Build query
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
        source,
        created_at,
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
          address,
          city,
          latitude,
          longitude
        ),
        retailer:retailers (
          retailer_id,
          name,
          website_url
        )
      `, { count: 'exact' })
      .lte('start_date', today)
      .gte('end_date', today);

    // Apply filters
    if (category) {
      query = query.eq('products.category', category);
    }

    if (retailerId) {
      query = query.eq('retailer_id', parseInt(retailerId));
    }

    if (minPrice) {
      query = query.gte('deal_price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('deal_price', parseFloat(maxPrice));
    }

    if (minDiscount) {
      query = query.gte('discount', parseInt(minDiscount));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,products.name.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('deal_price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('deal_price', { ascending: false });
        break;
      case 'discount_desc':
        query = query.order('discount', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
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
