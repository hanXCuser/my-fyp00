import { DatabaseService } from './database';
import { ShopriteScraper } from './shoprite/shoprite-scraper';

/**
 * Test scraping and saving to database
 * Run: npm run test:save-db
 */
async function testSaveToDatabase() {
  console.log('🧪 Testing Scraper with Database Save...\n');

  const scraper = new ShopriteScraper();
  const db = new DatabaseService();
  
  try {
    // Get retailer ID from database
    console.log('📝 Getting retailer from database...');
    const retailerId = await db.getOrCreateRetailer(
      'Shoprite',
      'https://www.shoprite.co.za',
      'Shoprite Mauritius - Leading supermarket chain'
    );
    console.log(`✅ Retailer ID: ${retailerId}\n`);

    // Get first available supermarket for this retailer
    console.log('🏪 Getting supermarket branch...');
    const supermarketId = await db.getSupermarket(retailerId);
    
    if (!supermarketId) {
      console.log('❌ No supermarket branch found for Shoprite');
      console.log('Please ensure supermarket branches are inserted in the database');
      return;
    }
    console.log(`✅ Supermarket ID: ${supermarketId}\n`);

    // Scrape deals
    console.log('🛒 Scraping Shoprite deals...');
    const result = await scraper.scrapeDeals();
    
    console.log(`✅ Scraped ${result.products.length} products\n`);

    if (result.products.length === 0) {
      console.log('⚠️  No products found to save');
      return;
    }

    // Save to database
    console.log('💾 Saving to database...');
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const saveResult = await db.saveScrapedData(
      retailerId,
      supermarketId,
      result.products,
      'web_scraping',
      startDate,
      endDate
    );

    console.log(`\n✅ Save Complete!`);
    console.log(`   Products created: ${saveResult.productsCreated}`);
    console.log(`   Deals created: ${saveResult.dealsCreated}`);

  } catch (error: any) {
    console.log(`\n❌ Error: ${error.message}`);
    console.error(error);
  }
}

testSaveToDatabase().catch(console.error);
