import { SuperUScraper } from '../../scraping/super-u/super-u-scraper';

async function run() {
  console.log('🧪 Running Super U scraper with database save for both locations');
  const scraper = new SuperUScraper();

  // Super U supermarkets from database:
  // ID 8: Super U Quatre Bornes (Plaines Withems)
  // ID 9: Super U Mahebourg (Grand Port)
  const supermarkets = [
    { id: 8, name: 'Super U Quatre Bornes', location: 'Plaines Withems' },
    { id: 9, name: 'Super U Mahebourg', location: 'Grand Port' }
  ];

  const startDate = '2025-12-31';
  const endDate = '2026-01-31';

  for (const supermarket of supermarkets) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📍 Processing: ${supermarket.name} (${supermarket.location})`);
      console.log(`   Supermarket ID: ${supermarket.id}`);
      console.log(`   Period: ${startDate} to ${endDate}`);
      console.log(`${'='.repeat(60)}\n`);

      const result = await scraper.scrapeAndSave(supermarket.id, startDate, endDate);

      console.log(`\n✅ Success: ${result.success}`);
      console.log(`📦 Products created: ${result.productsCreated}`);
      console.log(`🎯 Deals created: ${result.dealsCreated}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`⚠️ Errors (${result.errors.length}):`);
        result.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
      }

    } catch (err: any) {
      console.error(`❌ Scraper failed for ${supermarket.name}:`, err.message || err);
      console.error(err);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Completed processing all Super U locations');
  console.log(`${'='.repeat(60)}\n`);
}

run().catch(console.error);
