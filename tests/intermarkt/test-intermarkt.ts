import { IntermartScraper } from '../../scraping/intermarkt/intermarkt-scraper';

async function testIntermarkt() {
  console.log('============================================================');
  console.log('🧪 Testing Intermarkt Scraper');
  console.log('============================================================\n');

  const scraper = new IntermartScraper();

  // Test 1: Find latest brochure URL
  console.log('📋 Test 1: Finding latest brochure URL');
  console.log('------------------------------------------------------------');
  const brochureUrl = await scraper.findLatestBrochureURL();
  
  if (brochureUrl) {
    console.log(`✅ Found: ${brochureUrl.substring(0, 100)}...\n`);
  } else {
    console.log('❌ No brochure URL found\n');
  }

  // Test 2: Scrape deals (without saving to database)
  console.log('📋 Test 2: Scraping deals');
  console.log('------------------------------------------------------------');
  const deals = await scraper.scrapeDeals();
  
  if (deals.length > 0) {
    console.log(`✅ Extracted ${deals.length} products\n`);
    console.log('Sample products (first 5):');
    deals.slice(0, 5).forEach((deal, index) => {
      console.log(`\n${index + 1}. ${deal.title}`);
      console.log(`   Price: Rs ${deal.deal_price}`);
      if (deal.original_price) {
        console.log(`   Original Price: Rs ${deal.original_price}`);
      }
      if (deal.discount) {
        console.log(`   Discount: ${deal.discount}%`);
      }
      console.log(`   Unit: ${deal.unit || 'N/A'}`);
      console.log(`   Brand: ${deal.brand || 'N/A'}`);
      console.log(`   Category: ${deal.category}`);
    });
  } else {
    console.log('❌ No deals extracted\n');
  }

  console.log('\n============================================================');
  console.log('✅ Test completed!');
  console.log('============================================================');
}

testIntermarkt().catch(console.error);
