import * as cheerio from 'cheerio';
import { DatabaseService } from '../database';
import { ScrapedProduct, ScraperResult } from '../types';
import { ScraperUtils } from '../utils';

export class ShopriteScraper {
  private utils: ScraperUtils;
  private db: DatabaseService;
  private readonly retailer = 'Shoprite';
  private readonly website = 'https://www.shoprite.co.za';

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
   * Extract brand from product name
   * Common patterns: "Brand Name Product Description"
   */
  private extractBrand(productName: string): string | undefined {
    if (!productName) return undefined;

    // Common brand patterns
    const knownBrands = [
      'Yardley', 'Coca-Cola', 'County Fair', 'Blue Ribbon', 'KOO', 'Danone',
      'Farmbest', 'Orley', 'Darling', 'TOWER', 'Nola', 'Cape Point', 'Baumann',
      "Fatti's & Moni's", 'Ritebrand', 'Ultra Mel', 'Shoprite'
    ];

    // Check if product name starts with a known brand
    for (const brand of knownBrands) {
      if (productName.toLowerCase().startsWith(brand.toLowerCase())) {
        return brand;
      }
    }

    // Extract first word(s) as brand (up to 3 words)
    const words = productName.split(' ');
    
    // If first word is capitalized and short (brand names are usually 1-2 words)
    if (words.length >= 1 && words[0].match(/^[A-Z]/)) {
      // Check if it's a 2-word brand (e.g., "Blue Ribbon", "County Fair")
      if (words.length >= 2 && words[1].match(/^[A-Z]/)) {
        return `${words[0]} ${words[1]}`;
      }
      // Single word brand
      return words[0];
    }

    return undefined;
  }

  /**
   * Extract unit from product name
   * Patterns: 1kg, 500g, 2L, 750ml, 1s, 5 Piece, etc.
   */
  private extractUnit(productName: string): string | undefined {
    if (!productName) return undefined;

    // Pattern for units: number + unit (e.g., "2L", "500g", "1kg", "90ml")
    const unitPatterns = [
      /(\d+(?:\.\d+)?)\s*(kg|kilogram|kilograms)/i,
      /(\d+(?:\.\d+)?)\s*(g|gram|grams)/i,
      /(\d+(?:\.\d+)?)\s*(mg|milligram|milligrams)/i,
      /(\d+(?:\.\d+)?)\s*(l|liter|liters|litre|litres)/i,
      /(\d+(?:\.\d+)?)\s*(ml|milliliter|milliliters|millilitre|millilitres)/i,
      /(\d+(?:\.\d+)?)\s*(s|piece|pieces|pack|packs|unit|units)/i,
    ];

    for (const pattern of unitPatterns) {
      const match = productName.match(pattern);
      if (match) {
        const value = match[1];
        let unit = match[2].toLowerCase();
        
        // Normalize unit names
        if (unit === 'kilogram' || unit === 'kilograms') unit = 'kg';
        if (unit === 'gram' || unit === 'grams') unit = 'g';
        if (unit === 'milligram' || unit === 'milligrams') unit = 'mg';
        if (unit === 'liter' || unit === 'liters' || unit === 'litre' || unit === 'litres') unit = 'L';
        if (unit === 'milliliter' || unit === 'milliliters' || unit === 'millilitre' || unit === 'millilitres') unit = 'ml';
        if (unit === 'piece' || unit === 'pieces') unit = 'piece';
        if (unit === 'pack' || unit === 'packs') unit = 'pack';
        if (unit === 'unit' || unit === 'units') unit = 'unit';
        
        return `${value}${unit}`;
      }
    }

    return undefined;
  }

  /**
   * Extract category from product name using keywords
   */
  private extractCategory(productName: string): string | undefined {
    if (!productName) return undefined;

    const name = productName.toLowerCase();

    // Category keywords mapping
    const categories: Record<string, string[]> = {
      'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'custard', 'maas', 'amasi'],
      'Beverages': ['coca-cola', 'coke', 'pepsi', 'juice', 'drink', 'soda', 'water', 'tea', 'coffee'],
      'Meat & Poultry': ['chicken', 'beef', 'pork', 'meat', 'sausage', 'braai', 'steak', 'lamb'],
      'Bakery': ['bread', 'buns', 'rolls', 'croissant', 'bagel', 'muffin'],
      'Canned Goods': ['baked beans', 'canned', 'tinned', 'tuna', 'mussels'],
      'Fresh Produce': ['cucumber', 'lettuce', 'tomato', 'carrot', 'onion', 'potato', 'fruit', 'vegetable'],
      'Pantry': ['pasta', 'rice', 'flour', 'sugar', 'salt', 'oil', 'sauce', 'mayonnaise'],
      'Snacks': ['chips', 'biscuits', 'cookies', 'crackers', 'nuts'],
      'Personal Care': ['deodorant', 'soap', 'shampoo', 'toothpaste', 'lotion'],
      'Frozen Foods': ['frozen', 'ice cream'],
      'Condiments': ['mayonnaise', 'ketchup', 'mustard', 'sauce', 'dressing'],
      'Desserts': ['jelly', 'pudding', 'dessert'],
    };

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (name.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Other';
  }

  /**
   * Test Shoprite selectors:
   * 1. Visit https://www.shoprite.co.za
   * 2. Navigate to specials/promotions
   * 3. F12 → Console → Test selectors
   * Note: Shoprite may use React/dynamic content - might need Puppeteer
   */
  async scrapeDeals(maxPages: number = 5): Promise<ScraperResult> {
    const errors: string[] = [];
    const products: ScrapedProduct[] = [];

    try {
      console.log(`🛒 Scraping ${this.retailer}...`);

      const possibleUrls = [
        '/specials',
        '/promotions',
        '/catalogue',
        '/deals',
        '/weekly-specials',
      ];

      let baseUrl = '';

      for (const url of possibleUrls) {
        try {
          await this.utils.fetchPage(url);
          baseUrl = url;
          console.log(`✅ Found Shoprite page at: ${url}`);
          break;
        } catch (error: any) {
          console.log(`❌ URL not found: ${url}`);
          continue;
        }
      }

      if (!baseUrl) {
        errors.push(
          'Could not find Shoprite promotions page. ' +
          'Website may use dynamic content (React/Vue) - consider using Puppeteer.'
        );
        return {
          success: false,
          products,
          deals: [],
          errors,
          retailer: this.retailer,
          scrapedAt: new Date(),
        };
      }

      console.log(`🔍 Searching for Shoprite products across ${maxPages} pages...`);

      // Scrape multiple pages
      for (let page = 0; page < maxPages; page++) {
        try {
          const pageUrl = `${baseUrl}?page=${page}`;
          console.log(`  📄 Scraping page ${page + 1}/${maxPages}...`);
          
          const html = await this.utils.fetchPage(pageUrl);
          const $ = cheerio.load(html);

          // Shoprite-specific selectors (verified from actual HTML)
          const selectors = {
            container: '.item-product',
            name: 'h3.item-product__name a',
            price: '.special-price__price .now',
            originalPrice: '.was-price, .old-price, del',
            image: '.item-product__image img',
            category: '.category',
          };

          let pageProducts = 0;

          let pageProducts = 0;

      $(selectors.container).each((i, el) => {
        try {
          const $el = $(el);

          const name = this.utils.sanitizeText(
            $el.find(selectors.name).first().text() ||
            $el.find('h2, h3, h4').first().text()
          );

          if (!name) return;

          const priceText = $el.find(selectors.price).first().text();
          const price = this.utils.extractPrice(priceText);

          if (price === 0) return;

          const originalPriceText = $el.find(selectors.originalPrice).first().text();
          const originalPrice = originalPriceText ? this.utils.extractPrice(originalPriceText) : undefined;

          const discount = originalPrice && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : undefined;

          let image_url = $el.find(selectors.image).first().attr('src') ||
                          $el.find(selectors.image).first().attr('data-src');

          if (image_url && !image_url.startsWith('http')) {
            image_url = image_url.startsWith('//')
              ? `https:${image_url}`
              : `${this.website}${image_url.startsWith('/') ? '' : '/'}${image_url}`;
          }

          // Extract brand and unit from product name
          const brand = this.extractBrand(name);
          const unit = this.extractUnit(name);
          const category = this.extractCategory(name);

          products.push({
            name,
            brand,
            unit,
            category,
            price,
            originalPrice,
            discount,
            image_url,
            url: baseUrl,
          });

          pageProducts++;

        } catch (error: any) {
          console.error(`Error parsing product ${i}:`, error.message);
        }
      });

          console.log(`     ✓ Found ${pageProducts} products on page ${page + 1}`);

          // If no products found, we've reached the end
          if (pageProducts === 0) {
            console.log(`  ⚠️  No products on page ${page + 1}, stopping pagination`);
            break;
          }

          // Small delay between pages to be respectful
          if (page < maxPages - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (error: any) {
          console.error(`  ❌ Error scraping page ${page + 1}:`, error.message);
          errors.push(`Page ${page + 1}: ${error.message}`);
        }
      }

      console.log(`✅ Scraped ${products.length} products from ${this.retailer}`);

      if (products.length === 0) {
        errors.push(
          `No products found. This site may require Puppeteer for JavaScript rendering. ` +
          `Visit ${this.website}${successUrl} to check if content loads dynamically.`
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
        'Shoprite Mauritius'
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
