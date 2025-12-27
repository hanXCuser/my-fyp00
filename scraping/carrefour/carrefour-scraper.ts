import * as cheerio from 'cheerio';
import { DatabaseService } from '../database';
import { ScrapedProduct, ScraperResult } from '../types';
import { ScraperUtils } from '../utils';

export class CarrefourScraper {
  private utils: ScraperUtils;
  private db: DatabaseService;
  private readonly retailer = 'Carrefour';
  private readonly website = 'https://www.carrefour.fr/magasins'; // Using FR site as MU is down

  constructor() {
    this.utils = new ScraperUtils({
      baseUrl: this.website,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    this.db = new DatabaseService();
  }

  /**
   * Test selectors with Chrome DevTools:
   * 1. Open https://www.carrefour.mu in browser
   * 2. Navigate to promotions/deals page
   * 3. Right-click on a product → Inspect Element
   * 4. In Console, test selectors:
   *    - document.querySelectorAll('.product-item')  // Find product containers
   *    - document.querySelector('.product-name')      // Find product name
   *    - document.querySelector('.price')             // Find price
   * 5. Update the selectors below based on actual HTML structure
   */
  async scrapeDeals(): Promise<ScraperResult> {
    const errors: string[] = [];
    const products: ScrapedProduct[] = [];

    try {
      console.log(`🛒 Scraping ${this.retailer}...`);

      // Try multiple possible URLs
      const possibleUrls = [
        '/promotions',
        '/offers',
        '/specials',
        '/deals',
        '/en/promotions',
      ];

      let html = '';
      let successUrl = '';

      for (const url of possibleUrls) {
        try {
          html = await this.utils.fetchPage(url);
          successUrl = url;
          console.log(`✅ Found page at: ${url}`);
          break;
        } catch (error: any) {
          console.log(`❌ URL not found: ${url}`);
          continue;
        }
      }

      if (!html) {
        errors.push('Could not find promotions page');
        return {
          success: false,
          products,
          deals: [],
          errors,
          retailer: this.retailer,
          scrapedAt: new Date(),
        };
      }

      // Parse HTML with cheerio
      const $ = cheerio.load(html);

      /* 
       * IMPORTANT: Update these selectors based on actual website structure
       * Test in DevTools Console with:
       * document.querySelectorAll('YOUR_SELECTOR_HERE')
       */
      const productSelectors = {
        container: '.product-item, .product-card, .promo-item, [data-product]',
        name: '.product-name, .product-title, h3, h4, .title',
        price: '.price, .product-price, .promo-price, [data-price]',
        originalPrice: '.old-price, .was-price, .original-price, del',
        image: 'img',
        description: '.description, .product-description',
        brand: '.brand, .manufacturer',
        category: '.category, .product-category',
      };

      console.log(`🔍 Searching for products with selector: ${productSelectors.container}`);

      $(productSelectors.container).each((i, el) => {
        try {
          const $el = $(el);

          // Extract product name
          const name = this.utils.sanitizeText(
            $el.find(productSelectors.name).first().text() ||
            $el.find('h2, h3, h4').first().text() ||
            ''
          );

          if (!name) return; // Skip if no name found

          // Extract price
          const priceText = $el.find(productSelectors.price).first().text();
          const price = this.utils.extractPrice(priceText);

          if (price === 0) return; // Skip if no valid price

          // Extract optional fields
          const originalPriceText = $el.find(productSelectors.originalPrice).first().text();
          const originalPrice = originalPriceText ? this.utils.extractPrice(originalPriceText) : undefined;

          const discount = originalPrice && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : undefined;

          let image_url = $el.find(productSelectors.image).first().attr('src') ||
                          $el.find(productSelectors.image).first().attr('data-src');

          // Handle relative URLs
          if (image_url && !image_url.startsWith('http')) {
            image_url = image_url.startsWith('//') 
              ? `https:${image_url}` 
              : `${this.website}${image_url.startsWith('/') ? '' : '/'}${image_url}`;
          }

          const description = this.utils.sanitizeText(
            $el.find(productSelectors.description).first().text()
          );

          const brand = this.utils.sanitizeText(
            $el.find(productSelectors.brand).first().text()
          );

          const category = this.utils.sanitizeText(
            $el.find(productSelectors.category).first().text()
          );

          products.push({
            name,
            price,
            originalPrice,
            discount,
            image_url,
            description: description || undefined,
            brand: brand || undefined,
            category: category || undefined,
            url: successUrl,
          });

        } catch (error: any) {
          console.error(`Error parsing product ${i}:`, error.message);
        }
      });

      console.log(`✅ Scraped ${products.length} products from ${this.retailer}`);

      if (products.length === 0) {
        errors.push(
          `No products found. Selectors may need updating. ` +
          `Visit ${this.website}${successUrl} and use DevTools to find correct selectors.`
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
      // Get retailer ID
      const retailer_id = await this.db.getOrCreateRetailer(
        this.retailer,
        this.website,
        'Carrefour Mauritius'
      );

      // Save to database
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
