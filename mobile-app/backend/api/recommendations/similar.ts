import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSimilarProducts } from '../../recommendations/rule-based-engine';

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
    const { product_id, latitude, longitude, limit } = req.query;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const context = {
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      limit: limit ? parseInt(limit as string) : 10,
    };

    const recommendations = await getSimilarProducts(parseInt(product_id as string), context);

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error: any) {
    console.error('Error getting similar products:', error);
    return res.status(500).json({ 
      error: 'Failed to get similar products',
      details: error.message 
    });
  }
}
