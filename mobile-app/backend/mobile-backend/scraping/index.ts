import { SuperUScraper } from './super-u/super-u-scraper';
import { ScraperResult } from './types';
import { WinnersScraper } from './winners/winners-scraper';
import { IntermartScraper } from './intermarkt/intermarkt-scraper';
import { MUCataloguesScraper } from './mu-catalogues/mu-catalogues-scraper';
import { archiveCurrentPrices } from './archive-and-rescrape';

export type RetailerName = 'winners' | 'superu' | 'intermart' | 'mu-catalogues' | 'all';
type ScraperKey = Exclude<RetailerName, 'all'>;

type ScraperAdapter = {
  scrapeDeals: (...args: any[]) => Promise<ScraperResult>;
  scrapeAndSave?: (...args: any[]) => Promise<{
    success: boolean;
    productsCreated: number;
    dealsCreated: number;
    errors: string[];
  }>;
};

export class MauritiusScraper {
  private scrapers: Record<ScraperKey, ScraperAdapter> = {
    winners: new WinnersScraper(),
    superu: new SuperUScraper(),
    intermart: (() => {
      const scraper = new IntermartScraper();
      return {
        scrapeDeals: async () => {
          const products = await scraper.scrapeDeals();
          return {
            success: products.length > 0,
            products,
            deals: [],
            errors: [],
            retailer: 'intermart',
            scrapedAt: new Date(),
          } satisfies ScraperResult;
        },
        scrapeAndSave: async (supermarket_id: number, startDate: Date, endDate: Date, pdfUrl?: string) => {
          const result = await scraper.scrapeAndSave(supermarket_id, startDate, endDate, pdfUrl);
          return {
            success: true,
            productsCreated: result.productsCreated,
            dealsCreated: result.dealsCreated,
            errors: [],
          };
        },
      } satisfies ScraperAdapter;
    })(),
    'mu-catalogues': new MUCataloguesScraper(),
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

    if (!scraper.scrapeAndSave) {
      throw new Error(`Scraper ${retailer} does not support save flow`);
    }

    return await scraper.scrapeAndSave(supermarket_id, startDate, endDate);
  }

  /**
   * Scrape all retailers in parallel
   */
  private async scrapeAllRetailers(): Promise<ScraperResult[]> {
    const promises = Object.values(this.scrapers).map((scraper) =>
      scraper.scrapeDeals().catch((error: any) => ({
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

/**
 * Convenience orchestrator: archive current prices, then scrape all retailers in parallel.
 */
export async function archiveAndScrapeAll(): Promise<{
  archived: number;
  results: ScraperResult[];
}> {
  console.log('Archiving current prices before scraping all retailers...');
  const archived = await archiveCurrentPrices();

  const scraper = new MauritiusScraper();
  const results = await scraper.scrapeDeals('all');

  return { archived, results };
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