import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPersonalizedDeals } from '../../recommendations/rule-based-engine';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, latitude, longitude, max_distance, limit } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const context = {
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      maxDistance: max_distance ? parseInt(max_distance as string) : 10,
      limit: limit ? parseInt(limit as string) : 20,
    };

    const recommendations = await getPersonalizedDeals(user_id as string, context);

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error: any) {
    console.error('Error getting personalized deals:', error);
    return res.status(500).json({ 
      error: 'Failed to get recommendations',
      details: error.message 
    });
  }
}
