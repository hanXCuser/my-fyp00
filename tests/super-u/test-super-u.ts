import { SuperUScraper } from '../../scraping/super-u/super-u-scraper';

async function run() {
  console.log('🧪 Running Super U scraper (test runner)');
  const scraper = new SuperUScraper();

  try {
    const result = await scraper.scrapeDeals();

    console.log(`\n✅ Success: ${result.success}`);
    console.log(`📦 Products scraped: ${result.products.length}`);
    if (result.errors && result.errors.length > 0) {
      console.log(`⚠️ Errors (${result.errors.length}):`);
      result.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    if (result.products.length > 0) {
      console.log('\nSample products (first 10):');
      result.products.slice(0, 10).forEach((p, i) => {
        console.log(`\n ${i + 1}. ${p.name}`);
        console.log(`    Price: ${p.price}`);
        if (p.originalPrice) console.log(`    Was: ${p.originalPrice} (${p.discount}% off)`);
        if (p.brand) console.log(`    Brand: ${p.brand}`);
        if (p.category) console.log(`    Category: ${p.category}`);
        if (p.unit) console.log(`    Unit: ${p.unit}`);
        if (p.image_url) console.log(`    Image: ${p.image_url}`);
      });
    }

  } catch (err: any) {
    console.error('❌ Scraper failed:', err.message || err);
  }
}

run().catch(console.error);
