import * as cheerio from 'cheerio';
import { DatabaseService } from '../database';
import { ScrapedProduct } from '../types';
import { ScraperUtils } from '../utils';

interface CatalogueInfo {
  title: string;
  url: string;
  validFrom: string;
  validTo: string;
  retailerName: string;
}

export class MUCataloguesScraper {
  private baseUrl = 'https://mu-catalogues.com';
  private db: DatabaseService;
  private utils: ScraperUtils;

  constructor() {
    this.db = new DatabaseService();
    this.utils = new ScraperUtils({
      baseUrl: this.baseUrl,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
  }

  /**
   * Get the latest catalogue for a retailer
   */
  async getLatestCatalogue(retailerSlug: string): Promise<CatalogueInfo | null> {
    console.log(`Finding latest catalogue for ${retailerSlug}...`);
    
    try {
      const html = await this.utils.fetchPage(`/${retailerSlug}-catalogues`);
      const $ = cheerio.load(html);

      // Find the first catalogue link (usually the latest)
      const firstCatalogue = $('a[href*="catalogues/"]').first();
      
      if (!firstCatalogue.length) {
        console.log(`No catalogues found for ${retailerSlug}`);
        return null;
      }

      const url = firstCatalogue.attr('href') || '';
      const title = firstCatalogue.text().trim();
      
      // Extract dates from text (format: "6 January - 22 January 2026")
      const dateText = $('a[href*="catalogues/"]').filter((i, el) => {
        return $(el).text().includes('January') || $(el).text().includes('20');
      }).first().text();

      const dateMatch = dateText.match(/(\d+)\s+(\w+)\s*-\s*(\d+)\s+(\w+)\s+(\d{4})/);
      
      let validFrom = '';
      let validTo = '';
      
      if (dateMatch) {
        const [_, startDay, startMonth, endDay, endMonth, year] = dateMatch;
        validFrom = this.parseDate(startDay, startMonth, year);
        validTo = this.parseDate(endDay, endMonth, year);
      }

      const retailerName = this.getRetailerName(retailerSlug);
      
      console.log(`Found catalogue: ${title}`);
      console.log(`Valid: ${validFrom} to ${validTo}`);
      console.log(`URL: ${url}`);

      return {
        title,
        url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
        validFrom,
        validTo,
        retailerName,
      };

    } catch (error: any) {
      console.error(`Error getting catalogue: ${error.message}`);
      return null;
    }
  }

  /**
   * Get retailer display name from slug
   */
  private getRetailerName(slug: string): string {
    const names: { [key: string]: string } = {
      'intermart': 'Intermarkt',
      'winners': 'Winners',
      'lolo-hyper': 'LOLO Hyper',
      'super-u': 'Super U',
    };
    return names[slug] || slug;
  }

  /**
   * Parse date string to YYYY-MM-DD format
   */
  private parseDate(day: string, month: string, year: string): string {
    const months: { [key: string]: string } = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    
    const monthNum = months[month.toLowerCase()] || '01';
    const dayPadded = day.padStart(2, '0');
    
    return `${year}-${monthNum}-${dayPadded}`;
  }

  /**
   * Scrape products from a catalogue page
   */
  async scrapeProducts(catalogueUrl: string): Promise<ScrapedProduct[]> {
    console.log(`Scraping products from catalogue...`);
    
    try {
      const html = await this.utils.fetchPage(catalogueUrl.replace(this.baseUrl, ''));
      const $ = cheerio.load(html);

      const products: ScrapedProduct[] = [];

      // Method 1: Look for product tables (some pages have pre-extracted products)
      $('table tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const name = $(cells[cells.length - 2]).text().trim();
          const priceText = $(cells[cells.length - 1]).text().trim();
          
          // Extract price (format: "Rs 129.95")
          const priceMatch = priceText.match(/Rs?\s*([\d,]+\.?\d*)/i);
          
          if (name && priceMatch) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            
            products.push({
              name: this.cleanProductName(name),
              price: price,
              brand: this.extractBrand(name),
              category: 'General',
              unit: this.extractUnit(name),
              description: name,
            });
          }
        }
      });

      // Method 2: Look for product divs/sections (fallback)
      if (products.length === 0) {
        console.log('No products in table format, trying alternative extraction...');
        
        // Look for any text that looks like prices
        const text = $('body').text();
        const priceMatches = text.matchAll(/([^\n]+?)\s+Rs?\s*([\d,]+\.?\d*)/gi);
        
        for (const match of priceMatches) {
          const name = match[1].trim();
          const price = parseFloat(match[2].replace(/,/g, ''));
          
          if (name.length > 3 && name.length < 100 && price > 0 && price < 100000) {
            products.push({
              name: this.cleanProductName(name),
              price: price,
              brand: this.extractBrand(name),
              category: 'General',
              unit: this.extractUnit(name),
              description: name,
            });
          }
        }
      }

      console.log(`Extracted ${products.length} products`);
      
      // Deduplicate by name
      const uniqueProducts = Array.from(
        new Map(products.map(p => [p.name.toLowerCase(), p])).values()
      );

      console.log(`After deduplication: ${uniqueProducts.length} unique products`);
      
      return uniqueProducts;

    } catch (error: any) {
      console.error(`Error scraping products: ${error.message}`);
      return [];
    }
  }

  /**
   * Clean product name
   */
  private cleanProductName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\.]/g, '')
      .trim()
      .substring(0, 200);
  }

  /**
   * Extract brand from product name (first capitalized word)
   */
  private extractBrand(name: string): string | undefined {
    const brands = ['Tefal', 'Arla', 'Yoplait', 'Nestle', 'Coca-Cola', 'Pepsi'];
    
    for (const brand of brands) {
      if (name.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    // Try to extract first capitalized word
    const words = name.split(' ');
    const firstCap = words.find(w => w.match(/^[A-Z][a-z]+$/));
    
    return firstCap;
  }

  /**
   * Extract unit from product name
   */
  private extractUnit(name: string): string | undefined {
    const unitMatch = name.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pack|piece|unit)/i);
    
    if (unitMatch) {
      return `${unitMatch[1]}${unitMatch[2].toLowerCase()}`;
    }
    
    return undefined;
  }

  /**
   * Scrape and save products from a retailer
   */
  async scrapeRetailer(
    retailerName: string,
    retailerSlug: string,
    retailerWebsite: string,
    supermarketId: number
  ): Promise<{ productsCreated: number; dealsCreated: number }> {
    console.log(`Starting ${retailerName} scraper (mu-catalogues.com)...`);
    
    try {
      // Get latest catalogue
      const catalogue = await this.getLatestCatalogue(retailerSlug);
      
      if (!catalogue) {
        throw new Error(`No catalogue found for ${retailerName}`);
      }

      // Scrape products
      const products = await this.scrapeProducts(catalogue.url);
      
      if (products.length === 0) {
        throw new Error(`No products extracted from catalogue`);
      }

      // Save to database
      console.log('Saving to database...');
      
      const retailer_id = await this.db.getOrCreateRetailer(
        retailerName,
        retailerWebsite,
        `${retailerName} Mauritius`
      );

      const { productsCreated, dealsCreated } = await this.db.saveScrapedData(
        retailer_id,
        supermarketId,
        products,
        'mu-catalogues.com',
        catalogue.validFrom,
        catalogue.validTo
      );

      console.log('Successfully saved to database!');
      console.log(`Products: ${productsCreated}`);
      console.log(`Deals: ${dealsCreated}`);

      return { productsCreated, dealsCreated };

    } catch (error: any) {
      console.error(`${retailerName} scraper failed:`, error.message);
      throw error;
    }
  }

  /**
   * Scrape Intermarkt
   */
  async scrapeIntermarkt(supermarketId: number) {
    return this.scrapeRetailer(
      'Intermarkt',
      'intermart',
      'https://intermartmauritius.com',
      supermarketId
    );
  }

  /**
   * Scrape Winners
   */
  async scrapeWinners(supermarketId: number) {
    return this.scrapeRetailer(
      'Winners',
      'winners',
      'https://www.winners.mu',
      supermarketId
    );
  }

  /**
   * Scrape LOLO Hyper
   */
  async scrapeLoloHyper(supermarketId: number) {
    return this.scrapeRetailer(
      'LOLO Hyper',
      'lolo-hyper',
      'https://lolohyper.mu',
      supermarketId
    );
  }

  /**
   * Main scrape and save method for scheduler
   */
  async scrapeAndSave(
    retailerSlug: string,
    websiteUrl: string,
    retailerDescription?: string
  ): Promise<{
    success: boolean;
    productsCreated: number;
    dealsCreated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Get latest catalogue
      const catalogue = await this.getLatestCatalogue(retailerSlug);
      if (!catalogue) {
        errors.push(`No catalogue found for ${retailerSlug}`);
        return { success: false, productsCreated: 0, dealsCreated: 0, errors };
      }

      // Scrape products
      const products = await this.scrapeProducts(catalogue.url);
      if (products.length === 0) {
        errors.push(`No products found in catalogue`);
        return { success: false, productsCreated: 0, dealsCreated: 0, errors };
      }

      // Get or create retailer
      const retailer_id = await this.db.getOrCreateRetailer(
        catalogue.retailerName,
        websiteUrl,
        retailerDescription || `${catalogue.retailerName} Mauritius`
      );

      // Get a supermarket for this retailer (use first one available, or 0 for retailer-level deals)
      const supermarket_id = await this.db.getSupermarket(retailer_id);
      
      console.log(`Using ${supermarket_id ? 'supermarket ID: ' + supermarket_id : 'retailer-level deals'}`);

      // Save to database
      const result = await this.db.saveScrapedData(
        retailer_id,
        supermarket_id || 0,
        products,
        'mu-catalogues.com',
        catalogue.validFrom,
        catalogue.validTo
      );

      console.log(`Successfully saved ${result.productsCreated} products and ${result.dealsCreated} deals`);

      return {
        success: true,
        productsCreated: result.productsCreated,
        dealsCreated: result.dealsCreated,
        errors: []
      };

    } catch (error: any) {
      errors.push(error.message);
      return { success: false, productsCreated: 0, dealsCreated: 0, errors };
    }
  }
}
