import { SuperUScraper } from './super-u/super-u-scraper.js';
import { ScraperResult } from './types.js';
import { WinnersScraper } from './winners/winners-scraper.js';
import { IntermartScraper } from './intermarkt/intermarkt-scraper.js';

export type RetailerName =  'winners' | 'superu' | 'intermart' | 'all';

export class MauritiusScraper {
  private scrapers = {
    winners: new WinnersScraper(),
    superu: new SuperUScraper(),
    intermart: new IntermartScraper(),
  };

  /**
   * Scrape deals from specific retailer(s)
   * @param retailer - Which retailer to scrape ('all' for all retailers)
   */
  async scrapeDeals(retailer: RetailerName): Promise<ScraperResult[]> {
    if (retailer === 'all') {
      return await this.scrapeAllRetailers();
    }

    const scraper = this.scrapers[retailer];
    if (!scraper) {
      throw new Error(`Unknown retailer: ${retailer}`);
    }

    const result = await scraper.scrapeDeals();
    return [result];
  }

  /**
   * Scrape and save deals to database
   * @param retailer - Which retailer to scrape
   * @param supermarket_id - Supermarket ID in database
   * @param startDate - Deal start date (YYYY-MM-DD)
   * @param endDate - Deal end date (YYYY-MM-DD)
   */
  async scrapeAndSave(
    retailer: RetailerName,
    supermarket_id: number,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    productsCreated: number;
    dealsCreated: number;
    errors: string[];
  }> {
    if (retailer === 'all') {
      throw new Error('Cannot save all retailers at once. Specify a retailer.');
    }

    const scraper = this.scrapers[retailer];
    if (!scraper) {
      throw new Error(`Unknown retailer: ${retailer}`);
    }

    return await scraper.scrapeAndSave(supermarket_id, startDate, endDate);
  }

  /**
   * Scrape all retailers in parallel
   */
  private async scrapeAllRetailers(): Promise<ScraperResult[]> {
    const promises = Object.values(this.scrapers).map((scraper) =>
      scraper.scrapeDeals().catch((error) => ({
        success: false,
        products: [],
        deals: [],
        errors: [error.message],
        retailer: 'unknown',
        scrapedAt: new Date(),
      }))
    );

    return await Promise.all(promises);
  }

  /**
   * Get aggregated results from multiple scraper results
   */
  static aggregateResults(results: ScraperResult[]): {
    totalProducts: number;
    totalDeals: number;
    successfulRetailers: string[];
    failedRetailers: string[];
    allProducts: any[];
    errors: string[];
  } {
    const allProducts = results.flatMap((r) => r.products);
    const totalDeals = results.reduce((sum, r) => sum + r.deals.length, 0);
    const successfulRetailers = results
      .filter((r) => r.success)
      .map((r) => r.retailer);
    const failedRetailers = results
      .filter((r) => !r.success)
      .map((r) => r.retailer);
    const errors = results.flatMap((r) => r.errors);

    return {
      totalProducts: allProducts.length,
      totalDeals,
      successfulRetailers,
      failedRetailers,
      allProducts,
      errors,
    };
  }
}

// Example usage:
// const scraper = new MauritiusScraper();
// 
// // Scrape all retailers
// const results = await scraper.scrapeDeals('all');
// const aggregated = MauritiusScraper.aggregateResults(results);
// console.log(`Found ${aggregated.totalProducts} products from ${aggregated.successfulRetailers.length} retailers`);
//
// // Scrape and save to database
// const today = new Date().toISOString().split('T')[0];
// const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
// const saved = await scraper.scrapeAndSave('carrefour', 1, today, nextWeek);
// console.log(`Saved ${saved.dealsCreated} deals`);