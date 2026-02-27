import { supabase } from '../../scraping/supabase-node';

/**
 * GET /api/deals/nearby
 * Get deals from supermarkets near user's location
 * Query params: lat, lng, radius (km, default: 10), limit (default: 50)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category') || null;

    if (!lat || !lng) {
      return Response.json(
        { error: 'Missing required parameters: lat, lng' },
        { status: 400 }
      );
    }

    // Calculate approximate bounding box to narrow down search
    // 1 degree latitude ≈ 111km
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180));

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
          logo_url,
          retailer:retailers (
            retailer_id,
            name,
            website_url
          )
        )
      `)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .limit(limit * 2); // Get more to filter by distance

    // Filter by category if provided
    if (category) {
      query = query.eq('product.category', category);
    }

    const { data: deals, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }

    // Calculate distance and filter by radius
    const dealsWithDistance = (deals || [])
      .map((deal: any) => {
        const supermarket = deal.supermarket;
        if (!supermarket?.latitude || !supermarket?.longitude) return null;

        // Haversine formula for distance
        const R = 6371; // Earth's radius in km
        const dLat = (supermarket.latitude - lat) * Math.PI / 180;
        const dLng = (supermarket.longitude - lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * Math.PI / 180) * Math.cos(supermarket.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
          ...deal,
          distance_km: parseFloat(distance.toFixed(2))
        };
      })
      .filter((deal: any) => deal && deal.distance_km <= radius)
      .sort((a: any, b: any) => a.distance_km - b.distance_km)
      .slice(0, limit);

    return Response.json({
      success: true,
      deals: dealsWithDistance,
      count: dealsWithDistance.length,
      location: { lat, lng },
      radius_km: radius
    });

  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
