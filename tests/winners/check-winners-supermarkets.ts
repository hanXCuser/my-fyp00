import { supabase } from './scraping/supabase-node';

async function checkWinnersSupermarkets() {
  console.log('🔍 Checking for Winners supermarkets in database...\n');

  // Check retailers
  const { data: retailers, error: retailerError } = await supabase
    .from('retailers')
    .select('*')
    .ilike('name', '%winners%');

  if (retailerError) {
    console.error('Error fetching retailers:', retailerError);
    return;
  }

  console.log(`📍 Found ${retailers?.length || 0} Winners retailer(s):`);
  retailers?.forEach(r => {
    console.log(`   - ID: ${r.retailer_id}, Name: ${r.name}`);
  });

  if (retailers && retailers.length > 0) {
    const winnersRetailerId = retailers[0].retailer_id;
    
    // Check supermarkets
    const { data: supermarkets, error: supermarketError } = await supabase
      .from('supermarkets')
      .select('*')
      .eq('retailer_id', winnersRetailerId);

    if (supermarketError) {
      console.error('Error fetching supermarkets:', supermarketError);
      return;
    }

    console.log(`\n🏪 Found ${supermarkets?.length || 0} Winners supermarket(s):`);
    supermarkets?.forEach(s => {
      console.log(`   - ID: ${s.supermarket_id}, Branch: ${s.branch_name}, Active: ${s.is_active}`);
    });

    if (supermarkets && supermarkets.length > 0) {
      console.log(`\n✅ Use supermarket_id: ${supermarkets[0].supermarket_id} for testing`);
    } else {
      console.log('\n⚠️  No Winners supermarkets found. Create one first!');
    }
  } else {
    console.log('\n⚠️  No Winners retailer found. Will be created automatically on first scrape.');
  }
}

checkWinnersSupermarkets().catch(console.error);
