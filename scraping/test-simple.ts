import { ShopriteScraper } from './shoprite/shoprite-scraper';

/**
 * Simple test for one scraper
 * Run: node --loader ts-node/esm scraping/test-simple.ts
 */
async function testShoprite() {
  console.log('🧪 Testing Shoprite Scraper...\n');

  const scraper = new ShopriteScraper();
  
  try {
    const result = await scraper.scrapeDeals();

    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📦 Products: ${result.products.length}`);
    console.log(`⚠️  Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((err: string, i: number) => console.log(`  ${i + 1}. ${err}`));
    }

    if (result.products.length > 0) {
      console.log('\n📋 Sample Products (first 3):');
      result.products.slice(0, 3).forEach((product: any, i: number) => {
        console.log(`\n  Product ${i + 1}:`);
        console.log(`    Name: ${product.name}`);
        console.log(`    Price: Rs ${product.price}`);
        if (product.originalPrice) {
          console.log(`    Was: Rs ${product.originalPrice} (${product.discount}% off)`);
        }
        if (product.category) console.log(`    Category: ${product.category}`);
      });
    }

  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    console.error(error);
  }
}

testShoprite().catch(console.error);
