import { supabase } from '../../scraping/supabase-node';

/**
 * GET /api/deals/by-retailer
 * Get all deals from a specific retailer
 * Query params: retailer_id, category (optional), limit (default: 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const retailerId = searchParams.get('retailer_id');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!retailerId) {
      return Response.json(
        { error: 'Missing required parameter: retailer_id' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('deals')
      .select(`
        deal_id,
        title,
        description,
        deal_price,
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
          latitude,
          longitude,
          address,
          contact_no,
          logo_url
        ),
        retailer:retailers (
          retailer_id,
          name,
          website_url,
          description
        )
      `)
      .eq('retailer_id', retailerId)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('deal_price', { ascending: true })
      .limit(limit);

    // Filter by category if provided
    if (category) {
      query = query.eq('product.category', category);
    }

    const { data: deals, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }

    // Get unique categories from results
    const categories = [...new Set(deals?.map((deal: any) => deal.product?.category).filter(Boolean))];

    return Response.json({
      success: true,
      deals: deals || [],
      count: deals?.length || 0,
      categories: categories,
      retailer_id: retailerId
    });

  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
