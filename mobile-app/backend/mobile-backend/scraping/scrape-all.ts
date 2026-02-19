import { DatabaseService } from './database';
import { MauritiusScraper, RetailerName } from './index';

/**
 * Scrape all retailers and save to database
 * Run: npm run scrape:all
 */
async function scrapeAllRetailers() {
  console.log('🚀 Starting Automated Scraping for All Retailers...\n');
  console.log('='.repeat(60));

  const mauritiusScraper = new MauritiusScraper();
  const db = new DatabaseService();

  // Retailer configuration
  const retailers: { name: RetailerName; displayName: string; website: string; description: string }[] = [
    { name: 'superu', displayName: 'Super U', website: 'https://www.superu.mu', description: 'Super U - French supermarket brand' },
    { name: 'winners', displayName: 'Winners', website: 'https://www.winners.mu', description: 'Winners - Mauritian supermarket chain' },
  ];

  // Deal validity period (7 days from now)
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let totalProducts = 0;
  let totalDeals = 0;
  let totalErrors = 0;

  for (const retailer of retailers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Processing: ${retailer.displayName.toUpperCase()}`);
    console.log('='.repeat(60));

    try {
      // Get or create retailer
      console.log('📝 Setting up retailer in database...');
      const retailerId = await db.getOrCreateRetailer(
        retailer.displayName,
        retailer.website,
        retailer.description
      );
      console.log(`✅ Retailer ID: ${retailerId}`);

      // Get supermarket branch
      const supermarketId = await db.getSupermarket(retailerId);
      
      if (!supermarketId) {
        console.log(`⚠️  No supermarket branch found for ${retailer.displayName}`);
        console.log('   Skipping - please add branches to database');
        continue;
      }
      console.log(`✅ Supermarket ID: ${supermarketId}`);

      // Scrape deals
      console.log(`🛒 Scraping ${retailer.displayName}...`);
      const results = await mauritiusScraper.scrapeDeals(retailer.name);
      const result = results[0];

      if (!result.success) {
        console.log(`❌ Scraping failed for ${retailer.displayName}`);
        console.log(`   Errors: ${result.errors.join(', ')}`);
        continue;
      }

      console.log(`✅ Scraped ${result.products.length} products`);

      if (result.products.length === 0) {
        console.log('⚠️  No products found - skipping database save');
        continue;
      }

      // Save to database
      console.log('💾 Saving to database...');
      const saveResult = await db.saveScrapedData(
        retailerId,
        supermarketId,
        result.products,
        'web_scraping',
        startDate,
        endDate
      );

      console.log(`✅ Saved successfully!`);
      console.log(`   Products created: ${saveResult.productsCreated}`);
      console.log(`   Deals created: ${saveResult.dealsCreated}`);

      totalProducts += saveResult.productsCreated;
      totalDeals += saveResult.dealsCreated;

    } catch (error: any) {
      console.log(`❌ Error processing ${retailer.displayName}: ${error.message}`);
      totalErrors++;
    }

    // Small delay between retailers to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SCRAPING COMPLETE - SUMMARY');
  console.log('='.repeat(60));
  console.log(`📦 Total Products Created: ${totalProducts}`);
  console.log(`🏷️  Total Deals Created: ${totalDeals}`);
  console.log(`⚠️  Total Errors: ${totalErrors}`);
  console.log(`📅 Deal Period: ${startDate} to ${endDate}`);
  console.log('='.repeat(60));
}

scrapeAllRetailers().catch(console.error);
