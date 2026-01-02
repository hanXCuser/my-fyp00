import { supabase } from '../../scraping/supabase-node';

async function cleanIntermartData() {
  console.log('🧹 Cleaning Intermarkt data from database...\n');

  // Get Intermarkt retailer ID
  const { data: retailer } = await supabase
    .from('retailers')
    .select('retailer_id')
    .eq('name', 'Intermarkt')
    .single();

  if (!retailer) {
    console.log('❌ Intermarkt retailer not found');
    return;
  }

  // Delete deals
  const { error: dealsError, count: dealsDeleted } = await supabase
    .from('deals')
    .delete({ count: 'exact' })
    .eq('retailer_id', retailer.retailer_id);

  if (dealsError) {
    console.error('❌ Error deleting deals:', dealsError);
    return;
  }

  console.log(`✅ Deleted ${dealsDeleted} deals`);
  console.log('✅ Cleanup complete! Ready for fresh data.\n');
}

cleanIntermartData().catch(console.error);
