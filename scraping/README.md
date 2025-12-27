# Mauritius Supermarket Scrapers

Web scrapers for major supermarkets in Mauritius with Supabase database integration.

## Features

- **Mauritius Retailers**: Carrefour, Winners, Shoprite
- **Database Integration**: Automatically saves to Supabase
- **Deal Tracking**: Scrapes promotions and special offers
- **Error Handling**: Robust retry logic and error reporting
- **TypeScript**: Fully typed for better development experience

## Retailers

Based on your database:
- **Carrefour** - https://www.carrefour.mu
- **Winners** - https://www.winners.mu
- **Shoprite** - https://www.shoprite.co.za
- **Intermart** - (Website: NULL, needs to be added)
- **Super U** - (Website: NULL, needs to be added)

## Installation

The scrapers use `axios` and `@supabase/supabase-js` which are already in your dependencies.

To enable HTML parsing, install:
```bash
npm install cheerio
npm install @types/cheerio --save-dev
```

For dynamic content (if needed):
```bash
npm install puppeteer
# or
npm install playwright
```

## Usage

### Basic Scraping

```typescript
import { MauritiusScraper } from './scraping';

const scraper = new MauritiusScraper();

// Scrape all retailers
const results = await scraper.scrapeDeals('all');

// Scrape specific retailer
const carrefourResults = await scraper.scrapeDeals('carrefour');

// Get aggregated results
const aggregated = MauritiusScraper.aggregateResults(results);
console.log(`Found ${aggregated.totalProducts} products`);
console.log(`Created ${aggregated.totalDeals} deals`);
```

### Save to Database

```typescript
import { MauritiusScraper } from './scraping';

const scraper = new MauritiusScraper();

// Define date range for deals
const today = new Date().toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Database Schema

The scrapers integrate with your Supabase database:

### Tables Used
- **retailers**: Stores retailer information (Carrefour, Winners, etc.)
- **products**: Stores product details (name, brand, category, etc.)
- **supermarkets**: Stores individual supermarket locations
- **deals**: Stores promotional deals with prices and dates

### Automatic Saving
The scraper will:
1. ✅ Create or find the retailer record
2. ✅ Create product records (or reuse existing ones)
3. ✅ Create deal records linking products to supermarkets
4. ✅ Handle duplicates automatically Carrefour deals (supermarket_id = 1)
const result = await scraper.scrapeAndSave('carrefour', 1, today, nextWeek);

console.log(`✅ Created ${result.productsCreated} products`);
console.log(`✅ Created ${result.dealsCreated} deals`);
if (result.errors.length > 0) {
  console.error('❌ Errors:', result.errors);
}
```

### Individual Scrapers

```typescript
import { CarrefourScraper } from './scraping/carrefour-scraper';

const carrefour = new CarrefourScraper();
const result = await carrefour.scrapeDeals();
```

## Important Notes

⚠️ **Legal & Ethical Considerations**:
- Always check the website's Terms of Service and robots.txt
- Respect rate limits and implement delays between requests
- Consider using official APIs when available
- Be mindful of the website's server load

⚠️ **Implementation Status**:
This is a **framework** with database integration. To make it fully functional:

**Required Steps**:
1. Install `cheerio` for HTML parsing
2. Inspect each website's structure using browser DevTools
3. Implement the parsing logic in each scraper's `scrapeDeals()` method
4. Test with actual website HTML
5. Handle pagination, authentication, or dynamic content as needed

**What's Already Built**:
- ✅ Complete database integration with Supabase
- ✅ Error handling and retry logic
- ✅ Type-safe interfaces matching your schema
- ✅ Duplicate prevention
- ✅ Parallel scraping capability

## Next Steps

1. **Inspect Websites**: Use browser DevTools on each retailer's promotions page
2. **Add cheerio**: `npm install cheerio @types/cheerio`
3. **Implement Parsing**: Fill in the TODO sections in each scraper
4. **Test**: Start with one retailer, verify database writes
5. **Schedule**: Set up cron jobs to run scrapers regularly

## Example with Cheerio (HTML Parsing)

```typescript
import cheerio from 'cheerio';

async scrapeDeals(): Promise<ScraperResult> {
  const html = await this.utils.fetchPage('/promotions');
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];
  
  $('.product-card').each((i, el) => {
    const name = $(el).find('.product-name').text().trim();
    const priceText = $(el).find('.price').text();
    const price = this.utils.extractPrice(priceText);
    const image_url = $(el).find('img').attr('src');
    
    products.push({
      name,
      price,
      image_url,
      brand: $(el).find('.brand').text().trim(),
      category: $(el).find('.category').text().trim(),
    });
  });
  
  return { success: true, products, deals: [], errors: [], ... };
}
## Data Interfaces

### Product
```typescript
interface Product {
  product_id?: number;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  description?: string;
}
```

### Deal
```typescript
interface Deal {
  deal_id?: number;
  product_id?: number;
  supermarket_id: number;
  retailer_id: number;
  title: string;
  deal_price: number;
  discount?: number;
  start_date: string;
  end_date: string;
  source: string;
}
```

## Important Notestring;
  originalPrice?: number;
  discount?: number;
  unit?: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  brand?: string;
  availability: boolean;
  url: string;
  sScheduling Scrapers

You can set up automated scraping using cron jobs or scheduled tasks:

```typescript
// Example: Run daily at 6 AM
import { MauritiusScraper } from './scraping';

async function dailyScrape() {
  const scraper = new MauritiusScraper();
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const retailers: ('carrefour' | 'winners' | 'shoprite')[] = ['carrefour', 'winners', 'shoprite'];
  
  for (const retailer of retailers) {
    try {
      const result = await scraper.scrapeAndSave(retailer, 1, today, nextWeek);
      console.log(`✅ ${retailer}: ${result.dealsCreated} deals`);
    } catch (error) {
      console.error(`❌ ${retailer} failed:`, error);
    }
  }
}
```

## License

Ensure you comply with each supermarket's Terms of Service before scraping
```

## Next Steps

1. **Choose Scraping Method**: Decide between HTML parsing or API calls
2. **Inspect Network Traffic**: Use browser DevTools to find API endpoints
3. **Implement Parsers**: Add actual parsing logic for each supermarket
4. **Test Thoroughly**: Test with various products and edge cases
5. **Add Caching**: Consider caching to reduce server load
6. **Monitor Changes**: Supermarket websites change frequently

## Example with Cheerio (HTML Parsing)

```typescript
import cheerio from 'cheerio';

async scrapeProducts(category: string): Promise<ScraperResult> {
  const html = await this.utils.fetchPage(`/category/${category}`);
  const $ = cheerio.load(html);
  
  const products: Product[] = [];
  $('.product-card').each((i, el) => {
    products.push({
      name: $(el).find('.product-name').text(),
      price: this.utils.extractPrice($(el).find('.price').text()),
      // ... more fields
    });
  });
  
  return { success: true, products, errors: [], ... };
}
```

## License

Ensure you comply with each supermarket's Terms of Service before using these scrapers.
