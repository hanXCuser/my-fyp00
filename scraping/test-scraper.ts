import { MauritiusScraper } from './index';

/**
 * Test scraper to verify selectors are working
 * Run with: npx ts-node scraping/test-scraper.ts
 */
async function testScrapers() {
  console.log('🧪 Testing Mauritius Scrapers...\n');

  const scraper = new MauritiusScraper();

  // Test each retailer (excluding carrefour since website is down)
  const retailers: ('winners' | 'shoprite' | 'spar' | 'superu')[] = ['winners', 'spar', 'superu', 'shoprite'];

  for (const retailer of retailers) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing ${retailer.toUpperCase()}`);
    console.log('='.repeat(50));

    try {
      const results = await scraper.scrapeDeals(retailer);
      const result = results[0];

      console.log(`\n✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📦 Products found: ${result.products.length}`);
      console.log(`⚠️  Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      }

      if (result.products.length > 0) {
        console.log('\n📋 Sample Products (first 3):');
        result.products.slice(0, 3).forEach((product, i) => {
          console.log(`\n  Product ${i + 1}:`);
          console.log(`    Name: ${product.name}`);
          console.log(`    Price: Rs ${product.price}`);
          if (product.originalPrice) {
            console.log(`    Original Price: Rs ${product.originalPrice}`);
            console.log(`    Discount: ${product.discount}%`);
          }
          if (product.brand) console.log(`    Brand: ${product.brand}`);
          if (product.category) console.log(`    Category: ${product.category}`);
          if (product.image_url) console.log(`    Image: ${product.image_url.substring(0, 60)}...`);
        });
      } else {
        console.log('\n⚠️  No products extracted. Check selectors!');
        console.log('   → Open the website in a browser');
        console.log('   → Press F12 for DevTools');
        console.log('   → Test selectors in Console (see DEVTOOLS_GUIDE.md)');
      }

    } catch (error: any) {
      console.log(`\n❌ Error testing ${retailer}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Testing Complete');
  console.log('='.repeat(50));
  console.log('\nNext Steps:');
  console.log('1. If selectors need updating, see DEVTOOLS_GUIDE.md');
  console.log('2. Update selectors in each scraper file');
  console.log('3. Run this test again to verify');
  console.log('4. When working, use scrapeAndSave() to store in database\n');
}

// Run the test
testScrapers().catch(console.error);
