import * as cheerio from 'cheerio';
import { DatabaseService } from '../database';
import { ScrapedProduct, ScraperResult } from '../types';
import { ScraperUtils } from '../utils';
const translate = require('translate-google-api');

export class SuperUScraper {
  private utils: ScraperUtils;
  private db: DatabaseService;
  private readonly retailer = 'Super U';
  private readonly website = 'https://www.superu.mu';

  constructor() {
    const insecure = Boolean(process.env.SCRAPER_INSECURE_TLS && process.env.SCRAPER_INSECURE_TLS !== '0');
    this.utils = new ScraperUtils({
      baseUrl: this.website,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      },
      insecureTLS: insecure,
    });
    this.db = new DatabaseService();
  }

  async scrapeDeals(): Promise<ScraperResult> {
    const errors: string[] = [];
    const products: ScrapedProduct[] = [];

    console.log(`🛒 Scraping ${this.retailer}...`);

    const possibleUrls = ['/en', '/en/promotions', '/en/specials', '/en/offers', '/', '/promotions', '/specials', '/offers'];

    let html = '';
    let successUrl = '';

    for (const p of possibleUrls) {
      try {
        html = await this.utils.fetchPage(p);
        successUrl = p;
        console.log(`✅ Found Super U page at: ${p}`);
        break;
      } catch (err: any) {
        console.log(`❌ URL not found: ${p}`);
      }
    }

    if (!html) {
      const msg = 'Could not access Super U website. Site may be down or blocking requests.';
      errors.push(msg);
      return { success: false, products, deals: [], errors, retailer: this.retailer, scrapedAt: new Date() };
    }

    // Scrape first page
    await this.scrapePage(html, successUrl, products);

    // Scrape additional pages with pagination
    let pageNum = 1;
    let hasMorePages = true;
    const maxPages = 20; // Safety limit to prevent infinite loops

    while (hasMorePages && pageNum <= maxPages) {
      try {
        const pageUrl = `/en/node?page=${pageNum}`;
        console.log(`📄 Fetching page ${pageNum}...`);
        const pageHtml = await this.utils.fetchPage(pageUrl);
        
        if (!pageHtml) {
          hasMorePages = false;
          break;
        }

        const initialCount = products.length;
        await this.scrapePage(pageHtml, pageUrl, products);
        const newProductsCount = products.length - initialCount;

        if (newProductsCount === 0) {
          console.log(`✅ No more products found on page ${pageNum}`);
          hasMorePages = false;
        } else {
          console.log(`✅ Found ${newProductsCount} products on page ${pageNum}`);
          pageNum++;
        }
      } catch (err: any) {
        console.log(`❌ Failed to fetch page ${pageNum}: ${err.message}`);
        hasMorePages = false;
      }
    }

    if (products.length === 0) {
      const msg = `No products found. Check selectors at ${this.website}${successUrl}`;
      return { success: false, products, deals: [], errors: [msg], retailer: this.retailer, scrapedAt: new Date() };
    }

    console.log(`✅ Scraped ${products.length} products from ${this.retailer} (across ${pageNum} pages)`);

    // Deduplicate products by name and price
    const uniqueProducts = this.deduplicateProducts(products);
    console.log(`🔄 Deduplicated to ${uniqueProducts.length} unique products`);

    // Translate product names from French to English
    console.log('🌍 Translating product names to English...');
    await this.translateProductNames(uniqueProducts);

    return { success: true, products: uniqueProducts, deals: [], errors: [], retailer: this.retailer, scrapedAt: new Date() };
  }

  /**
   * Deduplicate products by name and price
   */
  private deduplicateProducts(products: ScrapedProduct[]): ScrapedProduct[] {
    const seen = new Map<string, ScrapedProduct>();
    
    for (const product of products) {
      // Create a unique key based on name and price
      const key = `${product.name.toLowerCase().trim()}_${product.price}`;
      
      if (!seen.has(key)) {
        seen.set(key, product);
      }
    }
    
    return Array.from(seen.values());
  }

  private async scrapePage(html: string, pageUrl: string, products: ScrapedProduct[]): Promise<void> {
    const $ = cheerio.load(html);

    const containerCandidates = ['figure.media-object', '[data-product]', '.product', '.product-item', '.card', '.item', '.product-card', '.offer', '.article'];
    const nameSelectors = ['.product-name', '.name', '.title', 'h3', 'h4', '.product-title', '.heading'];
    const priceSelectors = ['.price', '.prix', '.product-price', '.special-price', '.now', '.amount'];
    const originalSelectors = ['.old-price', '.prix-barre', 'del', '.was-price', '.original-price'];

    let containers: cheerio.Cheerio | null = null;
    for (const sel of containerCandidates) {
      const found = $(sel);
      if (found && found.length > 0) {
        containers = found;
        console.log(`Using container selector: ${sel} (${found.length})`);
        break;
      }
    }

    if (!containers) {
      const pricePattern = /(Rs\.?|MUR|₨)?\s?\d+[\d.,\s]*\d/;
      const potential: any[] = [];
      $('*').each((i, el) => {
        const txt = $(el).text();
        if (txt && pricePattern.test(txt) && $(el).children().length < 8) potential.push(el);
      });
      if (potential.length > 0) {
        containers = $(potential);
        console.log(`Fallback heuristic matched ${potential.length} elements`);
      }
    }

    if (!containers) {
      console.log('⚠️ No product containers found');
    } else {
      containers.each((i, el) => {
        try {
          const $el = $(el);

          // Name - extract from h3 element specifically
          let name = '';
          const h3Element = $el.find('h3').first();
          if (h3Element.length > 0) {
            name = this.utils.sanitizeText(h3Element.text());
          }
          
          // Fallback: find longest non-numeric text
          if (!name || name.length < 2) {
            const candidates: string[] = [];
            $el.find('h1,h2,h3,h4,h5,p,span,div,a').each((i, elem) => {
              const text = $(elem).text().trim();
              if (text && !candidates.includes(text)) {
                candidates.push(text);
              }
            });
            
            const validNames = candidates
              .filter(t => {
                return t.length > 3 && /[a-zA-ZÀ-ÿ]/.test(t);
              })
              .sort((a, b) => b.length - a.length);
            
            name = this.utils.sanitizeText(validNames[0] || '');
          }
          
          if (!name || name.length < 2) return;

          // Price - Super U uses .promo for current price
          let price = 0;
          const promoElement = $el.find('.promo').first();
          if (promoElement.length > 0) {
            const promoText = promoElement.text().trim();
            price = this.utils.extractPrice(promoText) || 0;
          }
          
          // Fallback to generic selectors
          if (price === 0) {
            for (const ps of priceSelectors) {
              const pe = $el.find(ps).first();
              const pt = pe.text();
              const p = pt ? this.utils.extractPrice(pt) : 0;
              if (p && p > 0) {
                price = p;
                break;
              }
            }
          }
          
          if (price === 0) return;

          // Original price - Super U uses <s> tag inside .price
          let originalPrice: number | undefined;
          const priceSpan = $el.find('.price').first();
          const strikethrough = priceSpan.find('s, del, strike').first();
          if (strikethrough.length > 0) {
            const strikeText = strikethrough.text().trim();
            const originalVal = this.utils.extractPrice(strikeText);
            if (originalVal && originalVal > price) {
              originalPrice = originalVal;
            }
          }
          
          // Fallback: look for any strikethrough in the container
          if (!originalPrice) {
            const anyStrike = $el.find('s, del, strike').first();
            if (anyStrike.length > 0) {
              const val = this.utils.extractPrice(anyStrike.text());
              if (val && val > price) originalPrice = val;
            }
          }

          const discount = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;

          // Unit/Description - Super U uses .description
          // Extract just the measurement (e.g., "500g", "1L") from French descriptions
          let unit: string | undefined;
          const description = $el.find('.description').first().text().trim();
          if (description) {
            // Match patterns like: 500g, 1kg, 1.5L, 2x330ml, 18x24 cm, x20, x6, etc.
            const unitMatch = description.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|cm|m|mm)|x\d+\s*(?:kg|g|l|ml|cm)?/i);
            if (unitMatch) {
              unit = unitMatch[0].trim().replace(',', '.');
            }
          }

          // Image
          let image_url: string | undefined;
          const img = $el.find('img').first();
          if (img && img.length > 0) {
            let src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
            if (src) {
              if (!src.startsWith('http')) src = src.startsWith('//') ? `https:${src}` : `${this.website}${src.startsWith('/') ? '' : '/'}${src}`;
              image_url = src;
            }
          }

          // Brand - often at the end of the name after a dash or slash
          let brand: string | undefined;
          if (name.includes(' - ')) {
            brand = name.split(' - ').pop()?.trim();
          } else if (name.includes(' / ')) {
            const parts = name.split(' / ');
            if (parts.length > 1) brand = parts[parts.length - 1].trim();
          }
          
          // Category - not available on Super U listing pages
          const category: string | undefined = undefined;

          products.push({ name, price, originalPrice, discount, image_url, brand, category, unit, url: pageUrl });
        } catch (err: any) {
          // Continue parsing others
        }
      });
    }
  }

  async scrapeAndSave(supermarket_id: number, startDate: string, endDate: string) {
    const result = await this.scrapeDeals();
    if (!result.success || result.products.length === 0) return { success: false, productsCreated: 0, dealsCreated: 0, errors: result.errors };

    try {
      const retailer_id = await this.db.getOrCreateRetailer(this.retailer, this.website, 'Super U Mauritius');
      const { productsCreated, dealsCreated } = await this.db.saveScrapedData(retailer_id, supermarket_id, result.products, 'web_scraping', startDate, endDate);
      return { success: true, productsCreated, dealsCreated, errors: [] };
    } catch (error: any) {
      return { success: false, productsCreated: 0, dealsCreated: 0, errors: [error.message] };
    }
  }

  private async translateProductNames(products: ScrapedProduct[]): Promise<void> {
    try {
      const names = products.map(p => p.name);
      const results = await translate(names, { from: 'fr', to: 'en' });
      
      results.forEach((result: any, index: number) => {
        if (result && typeof result === 'string') {
          products[index].name = result;
        }
      });
    } catch (error) {
      console.warn('Translation failed, keeping original names:', error);
    }
  }
}
