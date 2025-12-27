import { supabase } from '../../lib/supabase';

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

    if (!lat || !lng) {
      return Response.json(
        { error: 'Missing required parameters: lat, lng' },
        { status: 400 }
      );
    }

    // Query deals from nearby supermarkets using Haversine formula
    const { data, error } = await supabase.rpc('get_nearby_deals', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radius,
      result_limit: limit
    });

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }

    return Response.json({
      success: true,
      deals: data,
      location: { lat, lng },
      radius_km: radius
    });

  } catch (error: any) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
