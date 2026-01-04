/**
 * Test Winners Scraper with Brochure Support
 * Run: npx tsx tests/winners/test-winners.ts
 */

import { WinnersScraper } from '../../scraping/winners/winners-scraper';
import '../../scraping/supabase-node'; // Initialize Supabase

async function testWinnersScraper() {
  console.log('🧪 Testing Winners Scraper with Brochure Support\n');
  console.log('='.repeat(80));

  const scraper = new WinnersScraper();

  // Use Winners Phoenix supermarket (ID: 4)
  const WINNERS_SUPERMARKET_ID = 4;

  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  console.log(`📅 Date Range: ${startDate} to ${endDate}`);
  console.log(`🏪 Supermarket ID: ${WINNERS_SUPERMARKET_ID}\n`);

  const result = await scraper.scrapeAndSave(
    WINNERS_SUPERMARKET_ID,
    startDate,
    endDate
  );

  console.log('\n' + '='.repeat(80));
  console.log('📊 Final Results:');
  console.log('='.repeat(80));
  console.log(`✅ Success: ${result.success}`);
  console.log(`📚 Brochures Saved: ${result.brochuresSaved}`);
  console.log(`📦 Products Created: ${result.productsCreated}`);
  console.log(`💰 Deals Created: ${result.dealsCreated}`);
  
  if (result.errors.length > 0) {
    console.log(`\n⚠️  Errors (${result.errors.length}):`);
    result.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 Next Steps:');
  console.log('   1. Check your pamphlets table for the saved brochures');
  console.log('   2. View brochures at: https://www.winners.mu/ebrochure');
  console.log('   3. For full product extraction, consider implementing:');
  console.log('      - OCR solution (tesseract.js)');
  console.log('      - Manual data entry interface');
  console.log('      - Contact Winners for API/data feed');
  console.log('='.repeat(80));
}

testWinnersScraper().catch(console.error);
