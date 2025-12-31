import { ShopriteScraper } from './shoprite-scraper.js';

/**
 * Test Shoprite scraper only
 * Run: npx ts-node scraping/test-shoprite.ts
 */
async function testShoprite() {
  console.log('🧪 Testing Shoprite Scraper (No Database Save)\n');
  console.log('='.repeat(50));

  try {
    const scraper = new ShopriteScraper();
    const result = await scraper.scrapeDeals();

    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📦 Products Found: ${result.products.length}`);
    console.log(`⚠️  Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    if (result.products.length > 0) {
      console.log('\n✅ Sample Products (first 3):');
      result.products.slice(0, 3).forEach((product, i) => {
        console.log(`\n  Product ${i + 1}:`);
        console.log(`    Name: ${product.name}`);
        console.log(`    Price: Rs ${product.price}`);
        if (product.originalPrice) {
          console.log(`    Was: Rs ${product.originalPrice} (${product.discount}% off)`);
        }
        if (product.brand) console.log(`    Brand: ${product.brand}`);
        if (product.category) console.log(`    Category: ${product.category}`);
        if (product.image_url) console.log(`    Image: ${product.image_url.substring(0, 60)}...`);
      });
      
      console.log(`\n\n📊 Total Products: ${result.products.length}`);
    } else {
      console.log('\n⚠️  No products found!');
      console.log('   Possible reasons:');
      console.log('   1. Website structure changed');
      console.log('   2. Selectors need updating');
      console.log('   3. Page requires JavaScript (needs Puppeteer)');
      console.log('   4. No promotions available right now');
    }

  } catch (error: any) {
    console.log(`\n❌ Error: ${error.message}`);
    console.log(error.stack);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test Complete - No Data Saved to Database');
  console.log('='.repeat(50));
}

testShoprite().catch(console.error);
