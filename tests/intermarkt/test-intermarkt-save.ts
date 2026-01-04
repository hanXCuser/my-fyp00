import { IntermartScraper } from '../../scraping/intermarkt/intermarkt-scraper';

async function testIntermartSave() {
  console.log('============================================================');
  console.log('🧪 Testing Intermarkt Scraper with Database Save');
  console.log('============================================================\n');

  const scraper = new IntermartScraper();

  // TODO: Update these values based on your database
  const supermarket_id = 25; // Intermarkt Main Branch supermarket ID
  const startDate = new Date('2025-12-17');
  const endDate = new Date('2026-01-11');

  // Optional: Provide manual PDF URL if auto-detection fails
  // const manualURL = 'https://intermartmauritius.com/wp-content/uploads/2025/12/INTERMART-BROCHURE-FROM-17-DEC-25-TO-11-JAN-26.pdf';
  
  try {
    await scraper.scrapeAndSave(
      supermarket_id,
      startDate,
      endDate
      // manualURL // Uncomment if you want to use manual URL
    );
    
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testIntermartSave().catch(console.error);
