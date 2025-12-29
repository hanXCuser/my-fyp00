import { supabase } from '../../scraping/supabase-node';

/**
 * GET /api/supermarkets/nearby
 * Get supermarket branches near user's location
 * Query params: lat, lng, radius (km, default: 20), retailer_id (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '20');
    const retailerId = searchParams.get('retailer_id');

    if (!lat || !lng) {
      return Response.json(
        { error: 'Missing required parameters: lat, lng' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('supermarkets')
      .select(`
        supermarket_id,
        branch_name,
        address,
        latitude,
        longitude,
        contact_no,
        opening_hours,
        logo_url,
        is_active,
        retailer:retailers (
          retailer_id,
          name,
          website_url,
          description
        )
      `)
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (retailerId) {
      query = query.eq('retailer_id', retailerId);
    }

    const { data: supermarkets, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch supermarkets' }, { status: 500 });
    }

    // Calculate distance and filter by radius
    const supermarketsWithDistance = (supermarkets || [])
      .map((supermarket: any) => {
        if (!supermarket.latitude || !supermarket.longitude) return null;

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
          ...supermarket,
          distance_km: parseFloat(distance.toFixed(2))
        };
      })
      .filter((supermarket: any) => supermarket && supermarket.distance_km <= radius)
      .sort((a: any, b: any) => a.distance_km - b.distance_km);

    return Response.json({
      success: true,
      supermarkets: supermarketsWithDistance,
      count: supermarketsWithDistance.length,
      location: { lat, lng },
      radius_km: radius
    });

  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
