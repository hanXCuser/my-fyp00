import * as cheerio from 'cheerio';
import { DatabaseService } from '../database';
import { ScrapedProduct, ScraperResult } from '../types';
import { ScraperUtils } from '../utils';

export class SuperUScraper {
  private utils: ScraperUtils;
  private db: DatabaseService;
  private readonly retailer = 'Super U';
  private readonly website = 'https://www.superu.mu';

  constructor() {
    this.utils = new ScraperUtils({
      baseUrl: this.website,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      },
    });
    this.db = new DatabaseService();
  }

  /**
   * Test Super U selectors:
   * 1. Visit https://www.superu.mu
   * 2. F12 → Console → Test: document.querySelectorAll('.product')
   * 3. Update selectors below
   */
  async scrapeDeals(): Promise<ScraperResult> {
    const errors: string[] = [];
    const products: ScrapedProduct[] = [];

    try {
      console.log(`🛒 Scraping ${this.retailer}...`);

      const possibleUrls = [
        '/',
        '/promotions',
        '/specials',
        '/offers',
        '/promos',
        '/deals',
      ];

      let html = '';
      let successUrl = '';

      for (const url of possibleUrls) {
        try {
          html = await this.utils.fetchPage(url);
          successUrl = url;
          console.log(`✅ Found Super U page at: ${url}`);
          break;
        } catch (error: any) {
          console.log(`❌ URL not found: ${url}`);
          continue;
        }
      }

      if (!html) {
        errors.push('Could not access Super U website. Site may be down or blocking requests.');
        return {
          success: false,
          products,
          deals: [],
          errors,
          retailer: this.retailer,
          scrapedAt: new Date(),
        };
      }

      const $ = cheerio.load(html);

      // Super U specific selectors - update after testing
      const selectors = {
        container: '.product, .product-item, .article, [data-product], .promo',
        name: '.product-name, .name, h3, h4, .title, .product-title',
        price: '.price, .prix, .product-price, .special-price',
        originalPrice: '.old-price, .prix-barre, del, .was-price',
        image: 'img',
        brand: '.brand, .marque',
        category: '.category, .categorie',
      };

      console.log(`🔍 Searching for Super U products...`);

      $(selectors.container).each((i, el) => {
        try {
          const $el = $(el);

          const name = this.utils.sanitizeText(
            $el.find(selectors.name).first().text() ||
            $el.find('h2, h3, h4, .heading').first().text()
          );

          if (!name || name.length < 3) return;

          const priceText = $el.find(selectors.price).first().text();
          const price = this.utils.extractPrice(priceText);

          if (price === 0) return;

          const originalPriceText = $el.find(selectors.originalPrice).first().text();
          const originalPrice = originalPriceText ? this.utils.extractPrice(originalPriceText) : undefined;

          const discount = originalPrice && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : undefined;

          let image_url = $el.find(selectors.image).first().attr('src') ||
                          $el.find(selectors.image).first().attr('data-src') ||
                          $el.find(selectors.image).first().attr('data-lazy-src');

          if (image_url && !image_url.startsWith('http')) {
            image_url = image_url.startsWith('//')
              ? `https:${image_url}`
              : `${this.website}${image_url.startsWith('/') ? '' : '/'}${image_url}`;
          }

          products.push({
            name,
            price,
            originalPrice,
            discount,
            image_url,
            brand: this.utils.sanitizeText($el.find(selectors.brand).first().text()) || undefined,
            category: this.utils.sanitizeText($el.find(selectors.category).first().text()) || undefined,
            url: successUrl,
          });

        } catch (error: any) {
          console.error(`Error parsing product ${i}:`, error.message);
        }
      });

      console.log(`✅ Scraped ${products.length} products from ${this.retailer}`);

      if (products.length === 0) {
        errors.push(
          `No products found. Check selectors at ${this.website}${successUrl}`
        );
      }

    } catch (error: any) {
      errors.push(`${this.retailer} scraper error: ${error.message}`);
    }

    return {
      success: errors.length === 0,
      products,
      deals: [],
      errors,
      retailer: this.retailer,
      scrapedAt: new Date(),
    };
  }

  async scrapeAndSave(supermarket_id: number, startDate: string, endDate: string): Promise<{
    success: boolean;
    productsCreated: number;
    dealsCreated: number;
    errors: string[];
  }> {
    const result = await this.scrapeDeals();
    
    if (!result.success || result.products.length === 0) {
      return {
        success: false,
        productsCreated: 0,
        dealsCreated: 0,
        errors: result.errors,
      };
    }

    try {
      const retailer_id = await this.db.getOrCreateRetailer(
        this.retailer,
        this.website,
        'Super U Mauritius'
      );

      const { productsCreated, dealsCreated } = await this.db.saveScrapedData(
        retailer_id,
        supermarket_id,
        result.products,
        'web_scraping',
        startDate,
        endDate
      );

      return {
        success: true,
        productsCreated,
        dealsCreated,
        errors: [],
      };
    } catch (error: any) {
      return {
        success: false,
        productsCreated: 0,
        dealsCreated: 0,
        errors: [error.message],
      };
    }
  }
}
