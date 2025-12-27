import { supabase } from '../../lib/supabase';

/**
 * GET /api/deals/by-retailer
 * Get all deals from a specific retailer
 * Query params: retailer (name), supermarket_id (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const retailerName = searchParams.get('retailer');
    const supermarketId = searchParams.get('supermarket_id');

    if (!retailerName) {
      return Response.json(
        { error: 'Missing required parameter: retailer' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('deals')
      .select(`
        deal_id,
        discount_price,
        discount_percentage,
        start_date,
        end_date,
        is_active,
        products (
          product_id,
          name,
          brand,
          category,
          image_url,
          description
        ),
        supermarkets (
          supermarket_id,
          branch_name,
          address,
          city,
          location,
          latitude,
          longitude,
          retailers (
            retailer_id,
            name,
            website_url
          )
        )
      `)
      .eq('supermarkets.retailers.name', retailerName)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('discount_percentage', { ascending: false });

    if (supermarketId) {
      query = query.eq('supermarket_id', parseInt(supermarketId));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }

    return Response.json({
      success: true,
      retailer: retailerName,
      deals: data,
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
