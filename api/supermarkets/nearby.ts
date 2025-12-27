import { supabase } from '../../lib/supabase';

/**
 * GET /api/supermarkets/nearby
 * Get supermarket branches near user's location
 * Query params: lat, lng, radius (km, default: 20), retailer (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '20');
    const retailer = searchParams.get('retailer');

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
        city,
        location,
        latitude,
        longitude,
        contact_no,
        opening_hours,
        retailers (
          retailer_id,
          name,
          logo_url,
          website_url
        )
      `)
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (retailer) {
      query = query.eq('retailers.name', retailer);
    }

    const { data: supermarkets, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch supermarkets' }, { status: 500 });
    }

    // Calculate distance and filter by radius
    const nearbySupermarkets = supermarkets
      ?.map((supermarket: any) => {
        const distance = calculateDistance(
          lat,
          lng,
          supermarket.latitude,
          supermarket.longitude
        );
        return { ...supermarket, distance_km: distance };
      })
      .filter((s: any) => s.distance_km <= radius)
      .sort((a: any, b: any) => a.distance_km - b.distance_km);

    return Response.json({
      success: true,
      supermarkets: nearbySupermarkets,
      location: { lat, lng },
      radius_km: radius,
      count: nearbySupermarkets?.length || 0
    });

  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
