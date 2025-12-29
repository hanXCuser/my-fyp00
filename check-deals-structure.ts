import { supabase } from './scraping/supabase-node';

async function checkDealsStructure() {
  console.log('=== Checking deals table structure ===\n');

  // Query 1: Get sample deal with all columns
  console.log('1. Sample deal record:');
  const { data: sampleDeal, error: dealError } = await supabase
    .from('deals')
    .select('*')
    .limit(1)
    .single();
  
  if (dealError) {
    console.log('Error:', dealError);
  } else if (sampleDeal) {
    console.log('Columns in deals table:', Object.keys(sampleDeal));
    console.log('Sample values:', sampleDeal);
  }
  console.log();

  // Query 2: Try to join with supermarkets
  console.log('2. Testing deals -> supermarkets relationship:');
  const { data: withSupermarket, error: joinError } = await supabase
    .from('deals')
    .select('deal_id, supermarket:supermarkets(*)')
    .limit(1)
    .single();
  
  if (joinError) {
    console.log('❌ Error joining with supermarkets:', joinError.message);
  } else {
    console.log('✓ Successfully joined with supermarkets');
  }
  console.log();

  // Query 3: Try to join with pamphlets
  console.log('3. Testing deals -> pamphlets relationship:');
  const { data: withPamphlet, error: pamphletError } = await supabase
    .from('deals')
    .select('deal_id, pamphlet:pamphlets(*)')
    .limit(1)
    .single();
  
  if (pamphletError) {
    console.log('❌ Error joining with pamphlets:', pamphletError.message);
  } else {
    console.log('✓ Successfully joined with pamphlets');
  }
  console.log();

  // Query 4: Check if pamphlets table exists
  console.log('4. Checking if pamphlets table exists:');
  const { data: pamphlets, error: pamphletTableError } = await supabase
    .from('pamphlets')
    .select('*')
    .limit(1);
  
  if (pamphletTableError) {
    console.log('❌ Pamphlets table error:', pamphletTableError.message);
  } else {
    console.log('✓ Pamphlets table exists');
    if (pamphlets && pamphlets.length > 0) {
      console.log('Pamphlet columns:', Object.keys(pamphlets[0]));
    }
  }
}

checkDealsStructure().catch(console.error);
