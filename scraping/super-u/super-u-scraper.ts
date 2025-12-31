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

    // Translate product names from French to English
    console.log('🌍 Translating product names to English...');
    await this.translateProductNames(products);

    return { success: true, products, deals: [], errors: [], retailer: this.retailer, scrapedAt: new Date() };
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
      const potential: CheerioElement[] = [] as any;
      $('*').each((i, el) => {
        const txt = $(el).text();
        if (txt && pricePattern.test(txt) && $(el).children().length < 8) potential.push(el);
      });
      if (potential.length > 0) {
        containers = $(potential as any);
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

          // Price
          let price = 0;
          let priceElement: cheerio.Cheerio | null = null;
          for (const ps of priceSelectors) {
            const pe = $el.find(ps).first();
            const pt = pe.text();
            const p = pt ? this.utils.extractPrice(pt) : 0;
            if (p && p > 0) {
              price = p;
              priceElement = pe;
              break;
            }
          }
          if (price === 0) {
            const mAll = $el.text().match(/(Rs\.?|MUR|₨)?\s?(\d+[\d.,]*\d)/g) || [];
            for (const mm of mAll) {
              const v = this.utils.extractPrice(mm);
              if (v && v > price) price = v;
            }
          }
          if (price === 0) return;

          // Original price detection (several heuristics)
          let originalPrice: number | undefined;

          // 1) explicit selectors like .old-price, .prix-barre
          for (const os of originalSelectors) {
            const ot = $el.find(os).first().text();
            if (ot) {
              const v = this.utils.extractPrice(ot);
              if (v && v > price) {
                originalPrice = v;
                break;
              }
            }
          }

          // 2) <del>, <s>, <strike> tags
          if (!originalPrice) {
            const delText = $el.find('del, s, strike').first().text();
            if (delText) {
              const v = this.utils.extractPrice(delText);
              if (v && v > price) originalPrice = v;
            }
          }

          // 3) elements styled or classed as struck-through
          if (!originalPrice) {
            const strikeCandidates = $el.find('*').filter((i, el2) => {
              const cls = ($(el2).attr('class') || '').toString();
              const style = ($(el2).attr('style') || '').toString();
              return /old|barre|strike|prix-barre|was-price|original/i.test(cls) || /line-?through/i.test(style);
            });
            for (let i2 = 0; i2 < strikeCandidates.length; i2++) {
              const t = $(strikeCandidates[i2]).text();
              const v = this.utils.extractPrice(t);
              if (v && v > price) {
                originalPrice = v;
                break;
              }
            }
          }

          // 4) sibling price elements near the price element (next/prev)
          if (!originalPrice && priceElement) {
            const siblings = priceElement.nextAll().add(priceElement.prevAll());
            siblings.each((i2, sEl) => {
              if (originalPrice) return;
              const t = $(sEl).text();
              const v = this.utils.extractPrice(t);
              if (v && v > price) originalPrice = v;
            });
          }

          // 5) fallback: any number in container greater than price (choose smallest > price)
          if (!originalPrice) {
            const nums: number[] = [];
            const allMatches = ($el.text().match(/(Rs\.?|MUR|₨)?\s?(\d+[\d.,]*\d)/g) || []);
            for (const mm of allMatches) {
              const v = this.utils.extractPrice(mm);
              if (v && v > price) nums.push(v);
            }
            if (nums.length > 0) originalPrice = Math.min(...nums);
          }

          const discount = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;

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

          const brand = this.utils.sanitizeText($el.find('.brand, .marque').first().text()) || undefined;
          const category = this.utils.sanitizeText($el.find('.category, .categorie').first().text()) || undefined;

          products.push({ name, price, originalPrice, discount, image_url, brand, category, url: pageUrl });
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
