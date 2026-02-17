import { supabase } from './supabase-node';

/**
 * Archive current deal prices to price_history table before re-scraping
 * This preserves historical price data for forecasting and analysis
 */
export async function archiveCurrentPrices() {
  console.log('Archiving current deal prices to price_history...');
  
  try {
    // Get all active deals with their current prices
    const { data: deals, error: fetchError } = await supabase
      .from('deals')
      .select(`
        deal_id,
        product_id,
        retailer_id,
        deal_price,
        source,
        deal_locations!inner(supermarket_id)
      `);

    if (fetchError) throw fetchError;

    if (!deals || deals.length === 0) {
      console.log('Warning: No deals found to archive');
      return 0;
    }

    console.log(`Found ${deals.length} deals to archive`);

    // Prepare price history records
    const priceHistoryRecords = [];
    
    for (const deal of deals) {
      // Get unique supermarket IDs for this deal
      const supermarketIds = [...new Set(
        deal.deal_locations.map((loc: any) => loc.supermarket_id)
      )];

      // Create a price history record for each supermarket location
      for (const supermarket_id of supermarketIds) {
        priceHistoryRecords.push({
          product_id: deal.product_id,
          supermarket_id: supermarket_id,
          old_price: deal.deal_price,
          collected_at: new Date().toISOString(),
          source: deal.source || 'scraping'
        });
      }
    }

    console.log(`Inserting ${priceHistoryRecords.length} price history records...`);

    // Batch insert price history records
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < priceHistoryRecords.length; i += BATCH_SIZE) {
      const batch = priceHistoryRecords.slice(i, i + BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from('price_history')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError.message);
        continue;
      }

      inserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} records`);
    }

    console.log(`Successfully archived ${inserted} price records to history`);
    return inserted;

  } catch (error) {
    console.error('Error archiving prices:', error);
    throw error;
  }
}

/**
 * Main function to archive and prepare for re-scraping
 */
async function main() {
  console.log('Starting price archiving process...\n');
  
  const archived = await archiveCurrentPrices();
  
  console.log('\nPrice archiving complete!');
  console.log(`Total records archived: ${archived}`);
  console.log('\nNext steps:');
  console.log('1. Run your scrapers to get fresh deal data');
  console.log('2. The deals table will be updated with new prices');
  console.log('3. Price history will preserve the old prices for forecasting');
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nFatal error:', error);
      process.exit(1);
    });
}
