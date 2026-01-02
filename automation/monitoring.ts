import { supabase } from '../scraping/supabase-node';

interface ScrapingLog {
  source_type: string;  // retailer name (e.g., 'Intermarkt')
  supermarket_id: number;
  source_url?: string;
  status: 'success' | 'failure' | 'partial';
  products_scraped: number;
  products_updated?: number;
  products_failed?: number;
  error_message?: string;
  duration_seconds: number;
  started_at: Date;
  completed_at: Date;
}

interface ScrapingStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  avg_products_per_run: number;
  avg_deals_per_run: number;
  last_successful_run?: Date;
  last_failed_run?: Date;
}

/**
 * Log scraping activity to database
 */
export async function logScrapingActivity(log: ScrapingLog): Promise<void> {
  try {
    const { error } = await supabase
      .from('scraping_logs')
      .insert({
        source_type: log.source_type,
        supermarket_id: log.supermarket_id,
        source_url: log.source_url,
        status: log.status,
        products_scraped: log.products_scraped,
        products_updated: log.products_updated || 0,
        products_failed: log.products_failed || 0,
        error_message: log.error_message,
        started_at: log.started_at.toISOString(),
        completed_at: log.completed_at.toISOString(),
        duration_seconds: log.duration_seconds
      });

    if (error) {
      console.error('Failed to log scraping activity:', error);
    }
  } catch (error) {
    console.error('Error logging scraping activity:', error);
  }
}

/**
 * Get scraping statistics for a specific scraper
 */
export async function getScraperStats(scraperName: string): Promise<ScrapingStats | null> {
  try {
    const { data, error } = await supabase
      .from('scraping_logs')
      .select('*')
      .eq('source_type', scraperName)
      .order('completed_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      return null;
    }

    const totalRuns = data.length;
    const successfulRuns = data.filter(log => log.status === 'success').length;
    const failedRuns = data.filter(log => log.status === 'failure').length;
    
    const successRate = (successfulRuns / totalRuns) * 100;
    
    const avgProducts = data.reduce((sum, log) => sum + (log.products_scraped || 0), 0) / totalRuns;
    const avgDeals = data.reduce((sum, log) => sum + (log.deals_created || 0), 0) / totalRuns;
    
    const lastSuccess = data.find(log => log.status === 'success');
    const lastFailure = data.find(log => log.status === 'failure');

    return {
      total_runs: totalRuns,
      successful_runs: successfulRuns,
      failed_runs: failedRuns,
      success_rate: Math.round(successRate * 10) / 10,
      avg_products_per_run: Math.round(avgProducts),
      avg_deals_per_run: Math.round(avgProducts),  // Use products_scraped as proxy
      last_successful_run: lastSuccess ? new Date(lastSuccess.completed_at) : undefined,
      last_failed_run: lastFailure ? new Date(lastFailure.completed_at) : undefined
    };
  } catch (error) {
    console.error('Error getting scraper stats:', error);
    return null;
  }
}

/**
 * Get recent scraping activity (all scrapers)
 */
export async function getRecentActivity(limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('scraping_logs')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Check scraper health (detects if scraper hasn't run recently)
 */
export async function checkScraperHealth(scraperName: string, maxHoursSinceLastRun: number = 48): Promise<{
  healthy: boolean;
  message: string;
  lastRun?: Date;
}> {
  try {
    const { data, error } = await supabase
      .from('scraping_logs')
      .select('completed_at, status')
      .eq('source_type', scraperName)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return {
        healthy: false,
        message: `No scraping logs found for ${scraperName}`
      };
    }

    const lastRun = new Date(data.completed_at);
    const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastRun > maxHoursSinceLastRun) {
      return {
        healthy: false,
        message: `${scraperName} hasn't run in ${Math.round(hoursSinceLastRun)} hours`,
        lastRun
      };
    }

    if (data.status === 'failure') {
      return {
        healthy: false,
        message: `${scraperName} last run failed`,
        lastRun
      };
    }

    return {
      healthy: true,
      message: `${scraperName} is healthy`,
      lastRun
    };
  } catch (error) {
    console.error('Error checking scraper health:', error);
    return {
      healthy: false,
      message: 'Error checking health'
    };
  }
}

/**
 * Monitor wrapper for scraping functions
 * Usage: const result = await monitorScraping('Intermarkt', async () => { ... });
 */
export async function monitorScraping(
  scraperName: string,
  supermarketId: number,
  scrapingFunction: () => Promise<{ productsCreated: number; dealsCreated: number }>
): Promise<{ productsCreated: number; dealsCreated: number }> {
  const startTime = Date.now();
  const startDate = new Date();
  
  try {
    const result = await scrapingFunction();
    const endDate = new Date();
    const durationSeconds = Math.round((endDate.getTime() - startDate.getTime()) / 1000);
    
    await logScrapingActivity({
      source_type: scraperName,
      supermarket_id: supermarketId,
      status: 'success',
      products_scraped: result.productsCreated,
      products_updated: result.dealsCreated,
      products_failed: 0,
      duration_seconds: durationSeconds,
      started_at: startDate,
      completed_at: endDate
    });
    
    return result;
  } catch (error: any) {
    const endDate = new Date();
    const durationSeconds = Math.round((endDate.getTime() - startDate.getTime()) / 1000);
    
    await logScrapingActivity({
      source_type: scraperName,
      supermarket_id: supermarketId,
      status: 'failure',
      products_scraped: 0,
      products_failed: 0,
      error_message: error.message,
      duration_seconds: durationSeconds,
      started_at: startDate,
      completed_at: endDate
    });
    
    throw error;
  }
}
