import { supabase } from '../../scraping/supabase-node';

/**
 * GET /api/deals/categories
 * Get available categories with deal counts
 */
export async function GET(request: Request) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get distinct categories from products that have active deals
    const { data, error } = await supabase
      .from('products')
      .select(`
        category,
        deals!inner(
          deal_id,
          start_date,
          end_date
        )
      `)
      .lte('deals.start_date', today)
      .gte('deals.end_date', today)
      .not('category', 'is', null);

    if (error) {
      console.error('Database error:', error);
      return Response.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Count deals per category
    const categoryCounts: Record<string, number> = {};
    data?.forEach(item => {
      const category = item.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const categories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return Response.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
