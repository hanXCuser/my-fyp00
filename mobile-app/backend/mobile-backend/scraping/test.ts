import { CarrefourScraper } from './carrefour/carrefour-scraper';
import { ShopriteScraper } from './shoprite/shoprite-scraper';
import { SparScraper } from './spar/spar-scraper';
import { SuperUScraper } from './super-u/super-u-scraper';
import { WinnersScraper } from './winners/winners-scraper';

/**
 * Simple test to check scrapers without saving to database
 * Run: npx ts-node scraping/test.ts
 */
async function testScrapers() {
  console.log('🧪 Testing Scrapers (No Database Save)\n');

  const scrapers = [
    { name: 'Carrefour', instance: new CarrefourScraper() },
    { name: 'Shoprite', instance: new ShopriteScraper() },
    { name: 'Spar', instance: new SparScraper() },
    { name: 'Super U', instance: new SuperUScraper() },
    { name: 'Winners', instance: new WinnersScraper() },
  ];

  for (const { name, instance } of scrapers) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing ${name}`);
    console.log('='.repeat(50));

    try {
      const result = await instance.scrapeDeals();

      console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📦 Products: ${result.products.length}`);
      console.log(`⚠️  Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach((err: string, i: number) => console.log(`  ${i + 1}. ${err}`));
      }

      if (result.products.length > 0) {
        console.log('\n📋 Sample Products (first 2):');
        result.products.slice(0, 2).forEach((product: any, i: number) => {
          console.log(`\n  Product ${i + 1}:`);
          console.log(`    Name: ${product.name}`);
          console.log(`    Price: Rs ${product.price}`);
          if (product.originalPrice) {
            console.log(`    Was: Rs ${product.originalPrice} (${product.discount}% off)`);
          }
          if (product.brand) console.log(`    Brand: ${product.brand}`);
          if (product.category) console.log(`    Category: ${product.category}`);
        });
      } else {
        console.log('\n⚠️  No products found - selectors may need updating');
      }

    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Testing Complete - No Data Saved');
  console.log('='.repeat(50));
}

testScrapers().catch(console.error);
