import * as cheerio from 'cheerio';
import { BrochureOCRProcessor } from '../brochure-ocr.js';
import { DatabaseService } from '../database.js';
import { supabase } from '../supabase-node.js';
import { ScrapedProduct, ScraperResult } from '../types.js';
import { ScraperUtils } from '../utils.js';

interface BrochureInfo {
  title: string;
  url: string;
  validFrom?: string;
  validTo?: string;
}

export class WinnersScraper {
  private utils: ScraperUtils;
  private db: DatabaseService;
  private readonly retailer = 'Winners';
  private readonly website = 'https://www.winners.mu';

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
   * Scrape brochure URLs from Winners ebrochure page
   */
  private async scrapeBrochures(): Promise<BrochureInfo[]> {
    const brochures: BrochureInfo[] = [];

    try {
      console.log('📖 Fetching Winners brochures...');
      const html = await this.utils.fetchPage('/ebrochure');
      const $ = cheerio.load(html);

      // Find Paperturn brochure links
      $('a[href*="paperturn-view.com"]').each((i, el) => {
        const url = $(el).attr('href');
        if (url) {
          // Extract title from URL or default
          const urlParts = url.split('/');
          const slug = urlParts[urlParts.length - 1]?.split('?')[0] || '';
          const title = slug.replace(/-/g, ' ').replace(/winners/gi, 'Winners').trim() || 'Winners Brochure';
          
          brochures.push({
            title: this.capitalizeTitle(title),
            url,
            validFrom: new Date().toISOString().split('T')[0],
            validTo: this.getDefaultValidTo(),
          });
        }
      });

      console.log(`✅ Found ${brochures.length} brochure(s)`);
    } catch (error: any) {
      console.error('❌ Error fetching brochures:', error.message);
    }

    return brochures;
  }

  /**
   * Capitalize title properly
   */
  private capitalizeTitle(title: string): string {
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get default valid_to date (2 weeks from now)
   */
  private getDefaultValidTo(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }

  /**
   * Save brochure to database
   */
  private async saveBrochure(
    supermarketId: number,
    brochure: BrochureInfo,
    uploadedBy: number = 1
  ): Promise<number | null> {
    try {
      // Check if brochure already exists
      const { data: existing } = await supabase
        .from('pamphlets')
        .select('pamphlet_id')
        .eq('file_url', brochure.url)
        .eq('supermarket_id', supermarketId)
        .maybeSingle();

      if (existing) {
        console.log(`📖 Brochure already exists: ${brochure.title}`);
        return existing.pamphlet_id;
      }

      // Insert new brochure
      const { data, error } = await supabase
        .from('pamphlets')
        .insert({
          supermarket_id: supermarketId,
          uploaded_by: uploadedBy,
          uploaded_date: new Date().toISOString().split('T')[0],
          file_url: brochure.url,
          valid_from: brochure.validFrom,
          valid_to: brochure.validTo,
          status: 'processed',
        })
        .select('pamphlet_id')
        .single();

      if (error) throw error;

      console.log(`✅ Saved brochure: ${brochure.title}`);
      return data.pamphlet_id;
    } catch (error: any) {
      console.error(`❌ Error saving brochure: ${error.message}`);
      return null;
    }
  }

  /**
   * Convert extracted product to scraped product format (legacy, not used)
   */
  // private convertToScrapedProduct(extracted: ExtractedProduct): ScrapedProduct {
  //   return {
  //     name: extracted.name,
  //     brand: extracted.brand,
  //     category: this.categorizeProduct(extracted.name),
  //     price: extracted.salePrice,
  //     originalPrice: extracted.originalPrice,
  //     discount: extracted.discount,
  //     unit: extracted.unit,
  //     image_url: undefined, // Would need additional processing to extract from brochure
  //   };
  // }

  /**
   * Simple category detection
   */
  private categorizeProduct(name: string): string | undefined {
    const nameLower = name.toLowerCase();
    
    const categories: Record<string, string[]> = {
      'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream'],
      'Beverages': ['juice', 'drink', 'water', 'tea', 'coffee', 'soda'],
      'Meat & Poultry': ['chicken', 'beef', 'pork', 'meat'],
      'Bakery': ['bread', 'buns', 'rolls'],
      'Fresh Produce': ['fruit', 'vegetable', 'lettuce', 'tomato'],
      'Pantry': ['pasta', 'rice', 'flour', 'sugar', 'oil'],
      'Snacks': ['chips', 'biscuits', 'cookies', 'crackers'],
      'Personal Care': ['soap', 'shampoo', 'toothpaste'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  /**
   * Attempt to extract deals from Paperturn brochure using OCR
   */
  private async extractDealsFromBrochure(brochureUrl: string, brochureTitle: string): Promise<ScrapedProduct[]> {
    console.log('🔍 Extracting deals using OCR...');
    
    try {
      const ocrProcessor = new BrochureOCRProcessor();
      const products = await ocrProcessor.processBrochure(brochureUrl, brochureTitle, 5);
      
      console.log(`✅ OCR extracted ${products.length} products`);
      return products;
      
    } catch (error: any) {
      console.error('❌ OCR extraction error:', error.message);
      console.log('💡 Falling back to basic extraction...');
      
      // Fallback to old method
      return this.extractDealsBasic(brochureUrl);
    }
  }

  /**
   * Convert ExtractedProduct (from OCR) to ScrapedProduct
   */
  private convertToScrapedProduct(product: ExtractedProduct): ScrapedProduct {
    return {
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      image_url: product.image_url,
      brand: product.brand,
      category: product.category || this.categorizeProduct(product.name),
      url: product.url,
      dealTitle: product.dealTitle || 'Winners Brochure Deal',
    };
  }

  /**
   * Basic extraction fallback (without OCR)
   */
  private async extractDealsBasic(brochureUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    try {
      console.log('🔍 Attempting to extract deals from brochure...');
      const html = await this.utils.fetchPage(brochureUrl);
      const $ = cheerio.load(html);

      // Paperturn brochures are image-based, so we look for structured data
      // This might be in JSON-LD, meta tags, or embedded scripts
      
      // Try to find JSON-LD data
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const jsonData = JSON.parse($(el).html() || '{}');
          // Process JSON-LD if it contains product info
          if (jsonData['@type'] === 'Product') {
            products.push({
              name: jsonData.name,
              price: parseFloat(jsonData.offers?.price || 0),
              image_url: jsonData.image,
              url: brochureUrl,
            });
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });

      // Extract from visible text (limited effectiveness)
      const text = $('body').text();
      const pricePattern = /Rs\s*(\d+(?:\.\d{2})?)/gi;
      let match;
      while ((match = pricePattern.exec(text)) !== null) {
        // Extract price context (product name nearby)
        const startPos = Math.max(0, match.index - 100);
        const endPos = Math.min(text.length, match.index + 50);
        const context = text.substring(startPos, endPos).trim();
        
        // This is very basic - would need ML/OCR for better extraction
        console.log(`Found price: Rs ${match[1]} in context: ${context.substring(0, 50)}...`);
      }

      if (products.length === 0) {
        console.log('⚠️  Paperturn brochures use canvas/images - manual extraction or OCR needed');
        console.log('💡 Recommendation: Manually add featured deals or implement OCR solution');
      }

    } catch (error: any) {
      console.error('❌ Error extracting from brochure:', error.message);
    }

    return products;
  }

  /**
   * Scrape Winners deals (from promos page if available)
   */
  async scrapeDeals(): Promise<ScraperResult> {
    const errors: string[] = [];
    const products: ScrapedProduct[] = [];

    try {
      console.log(`🛒 Scraping ${this.retailer}...`);

      const possibleUrls = [
        '/promotions',
        '/specials',
        '/deals',
        '/offers',
        '/weekly-specials',
      ];

      let html = '';
      let successUrl = '';

      for (const url of possibleUrls) {
        try {
          html = await this.utils.fetchPage(url);
          successUrl = url;
          console.log(`✅ Found Winners page at: ${url}`);
          break;
        } catch (error: any) {
          console.log(`❌ URL not found: ${url}`);
          continue;
        }
      }

      if (!html) {
        errors.push('Could not find Winners promotions page');
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

      // Test these selectors with DevTools!
      const selectors = {
        container: '.product, .product-item, .deal-item, .promo',
        name: '.name, .title, h3, .product-name',
        price: '.price, .sale-price, .promo-price',
        originalPrice: '.original-price, .was, del',
        image: 'img',
        brand: '.brand',
        category: '.category',
      };

  console.log(`🔍 Searching for products...`);
  console.log(`📍 Trying selectors on: ${successUrl}`);

      $(selectors.container).each((i, el) => {
        try {
          const $el = $(el);

          const name = this.utils.sanitizeText(
            $el.find(selectors.name).first().text() ||
            $el.find('h2, h3, h4, .heading').first().text()
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
    brochuresSaved: number;
    errors: string[];
  }> {
    let brochuresSaved = 0;
    let productsCreated = 0;
    let dealsCreated = 0;
    const errors: string[] = [];

    try {
      // Step 1: Scrape and save brochures
      console.log('\n📖 Step 1: Scraping brochures...');
      const brochures = await this.scrapeBrochures();
      
      for (const brochure of brochures) {
        const pamphletId = await this.saveBrochure(supermarket_id, brochure);
        if (pamphletId) {
          brochuresSaved++;
          
          // Step 2: Try to extract deals from brochure
          console.log(`\n🔍 Step 2: Extracting deals from ${brochure.title}...`);
          const extractedProducts = await this.extractDealsFromBrochure(brochure.url, brochure.title);
          
          
          if (extractedProducts.length > 0) {
            const retailer_id = await this.db.getOrCreateRetailer(
              this.retailer,
              this.website,
              'Winners Supermarket Mauritius'
            );

            try {
              const webScrapeResult = await this.db.saveScrapedData(
                retailer_id,
                supermarket_id,
                extractedProducts,
                'web_scraping',
                startDate,
                endDate
              );

              productsCreated += webScrapeResult.productsCreated;
              dealsCreated += webScrapeResult.dealsCreated;

              const pamphletResult = await this.db.saveScrapedData(
                retailer_id,
                supermarket_id,
                extractedProducts,
                'pamphlet',
                startDate,
                endDate,
                pamphletId
              );
              productsCreated += pamphletResult.productsCreated;
              dealsCreated += pamphletResult.dealsCreated;
              if (pamphletResult.productsCreated === 0 || pamphletResult.dealsCreated === 0) {
                console.warn('⚠️ No products or deals saved for extracted brochure products:', extractedProducts);
              }
            } catch (error: any) {
              console.error('Error saving extracted products to database:', error.message);
              console.log('Extracted products:', extractedProducts);
            }
          }
        }
      }

      // Step 3: Try regular web scraping (promos page)
      console.log('\n🛒 Step 3: Attempting regular web scraping...');
      const webResult = await this.scrapeDeals();
      
      if (webResult.success && webResult.products.length > 0) {
        const retailer_id = await this.db.getOrCreateRetailer(
          this.retailer,
          this.website,
          'Winners Supermarket Mauritius'
        );

        const result = await this.db.saveScrapedData(
          retailer_id,
          supermarket_id,
          webResult.products,
          'web_scraping',
          startDate,
          endDate
        );

        productsCreated += result.productsCreated;
        dealsCreated += result.dealsCreated;
      } else {
        errors.push(...webResult.errors);
      }

      console.log('\n✅ Winners scraping completed!');
      console.log(`📊 Summary:`);
      console.log(`   - Brochures saved: ${brochuresSaved}`);
      console.log(`   - Products created: ${productsCreated}`);
      console.log(`   - Deals created: ${dealsCreated}`);

      return {
        success: brochuresSaved > 0 || dealsCreated > 0,
        productsCreated,
        dealsCreated,
        brochuresSaved,
        errors: errors.length > 0 ? errors : [],
      };

    } catch (error: any) {
      return {
        success: false,
        productsCreated: 0,
        dealsCreated: 0,
        brochuresSaved: 0,
        errors: [error.message],
      };
    }
  }
}
