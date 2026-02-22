import { DatabaseService } from './database';
import { MauritiusScraper, RetailerName } from './index';
import { supabase } from './supabase-node';

/**
 * Scrape all retailers and save to database
 * Run: npm run scrape:all
 */
async function scrapeAllRetailers() {
  console.log('Starting Automated Scraping for All Retailers...\n');
  console.log('='.repeat(60));

  const mauritiusScraper = new MauritiusScraper();
  const db = new DatabaseService();

<<<<<<< Updated upstream
  // Retailer configuration
  const retailers: { name: RetailerName; displayName: string; website: string; description: string }[] = [
    { name: 'superu', displayName: 'Super U', website: 'https://www.superu.mu', description: 'Super U - French supermarket brand' },
    { name: 'winners', displayName: 'Winners', website: 'https://www.winners.mu', description: 'Winners - Mauritian supermarket chain' },
  ];
=======
  // Load target retailers from database
  let retailers = await loadRetailersFromDatabase(db);

  // Fallback to hardcoded list if DB fetch fails or returns empty
  if (!retailers || retailers.length === 0) {
    console.log('Using fallback retailer list (DB unavailable or empty)');
    retailers = await getFallbackRetailers(db);
  }

  if (retailers.length === 0) {
    console.log('No target retailers found (DB + fallback). Add retailers before running.');
    return;
  }
>>>>>>> Stashed changes

  // Deal validity period (7 days from now)
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let totalProducts = 0;
  let totalDeals = 0;
  let totalErrors = 0;

  for (const retailer of retailers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${retailer.displayName.toUpperCase()}`);
    console.log('='.repeat(60));

    try {
      const retailerId = retailer.retailerId;
      const supermarketId = retailer.supermarketId;

      // Scrape deals
      console.log(`Scraping ${retailer.displayName}...`);
      const results = await mauritiusScraper.scrapeDeals(retailer.name);
      const result = results[0];

      if (!result.success) {
        console.log(`Scraping failed for ${retailer.displayName}`);
        console.log(`   Errors: ${result.errors.join(', ')}`);
        continue;
      }

      console.log(`Scraped ${result.products.length} products`);

      if (result.products.length === 0) {
        console.log('No products found - skipping database save');
        continue;
      }

      // Save to database
      console.log('Saving to database...');
      const saveResult = await db.saveScrapedData(
        retailerId,
        supermarketId,
        result.products,
        'web_scraping',
        startDate,
        endDate
      );

      console.log(`Saved successfully!`);
      console.log(`   Products created: ${saveResult.productsCreated}`);
      console.log(`   Deals created: ${saveResult.dealsCreated}`);

      totalProducts += saveResult.productsCreated;
      totalDeals += saveResult.dealsCreated;

    } catch (error: any) {
      console.log(`Error processing ${retailer.displayName}: ${error.message}`);
      totalErrors++;
    }

    // Small delay between retailers to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('SCRAPING COMPLETE - SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Products Created: ${totalProducts}`);
  console.log(`Total Deals Created: ${totalDeals}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Deal Period: ${startDate} to ${endDate}`);
  console.log('='.repeat(60));
}

scrapeAllRetailers().catch(console.error);

// Helpers
type RetailerRecord = {
  name: RetailerName;
  displayName: string;
  website: string;
  description: string;
  retailerId: number;
  supermarketId: number;
};

const RETAILER_NAME_MAP: Record<string, RetailerName> = {
  winners: 'winners',
  'super u': 'superu',
  superu: 'superu',
  intermart: 'intermart',
  intermarkt: 'intermart',
  'mu catalogues': 'mu-catalogues',
  'mu-catalogues': 'mu-catalogues',
};

async function loadRetailersFromDatabase(db: DatabaseService): Promise<RetailerRecord[]> {
  const { data, error } = await supabase
    .from('retailers')
    .select('retailer_id, name, website_url, description');

    if (error) {
      console.error('Failed to load retailers from database:', error.message);
    return [];
  }

  const records: RetailerRecord[] = [];

  for (const row of data || []) {
    const key = RETAILER_NAME_MAP[(row.name || '').toLowerCase()];
    if (!key) continue; // skip retailers we don't have scrapers for

    const retailerId = row.retailer_id as number;
    const supermarketId = await db.getSupermarket(retailerId);
    if (!supermarketId) {
      console.log(`No active supermarket for retailer ${row.name}, skipping.`);
      continue;
    }

    records.push({
      name: key,
      displayName: row.name,
      website: row.website_url,
      description: row.description,
      retailerId,
      supermarketId,
    });
  }

  return records;
}

async function getFallbackRetailers(db: DatabaseService): Promise<RetailerRecord[]> {
  const fallback: { name: RetailerName; displayName: string; website: string; description: string }[] = [
    { name: 'winners', displayName: 'Winners', website: 'https://www.winnersmauritius.com', description: 'Winners - Mauritian supermarket chain' },
    { name: 'superu', displayName: 'Super U', website: 'https://www.superu.mu', description: 'Super U - French supermarket brand' },
    { name: 'intermart', displayName: 'Intermart', website: 'https://intermartmauritius.com', description: 'Intermart Mauritius promotions' },
    { name: 'mu-catalogues', displayName: 'MU Catalogues', website: 'https://mu-catalogues.com', description: 'Aggregated brochures for multiple supermarkets' },
  ];

  const records: RetailerRecord[] = [];

  for (const retailer of fallback) {
    const retailerId = await db.getOrCreateRetailer(retailer.displayName, retailer.website, retailer.description);
    const supermarketId = await db.getSupermarket(retailerId);
    if (!supermarketId) {
      console.log(` No active supermarket for fallback retailer ${retailer.displayName}, skipping.`);
      continue;
    }

    records.push({
      ...retailer,
      retailerId,
      supermarketId,
    });
  }

  return records;
}
