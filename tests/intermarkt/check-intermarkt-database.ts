import { supabase } from '../../scraping/supabase-node';

/**
 * Check and add Intermarkt to the database
 * This script will:
 * 1. Check if Intermarkt retailer exists
 * 2. Create retailer if missing
 * 3. Check for supermarkets
 * 4. Create default supermarket if missing
 */
async function checkIntermartDatabase() {
  console.log('============================================================');
  console.log('🏪 Checking Intermarkt in Database');
  console.log('============================================================\n');

  // Step 1: Check/Create Retailer
  console.log('📋 Step 1: Checking Retailer...\n');
  
  const { data: existingRetailers } = await supabase
    .from('retailers')
    .select('*')
    .eq('name', 'Intermarkt');

  let retailerId: number;

  if (!existingRetailers || existingRetailers.length === 0) {
    console.log('⚠️  Intermarkt retailer not found. Creating...\n');
    
    const { data: newRetailer, error: retailerError } = await supabase
      .from('retailers')
      .insert({
        name: 'Intermarkt',
        description: 'Intermarkt Mauritius - Your neighborhood supermarket offering quality products at competitive prices',
        website_url: 'https://intermartmauritius.com/',
      })
      .select()
      .single();

    if (retailerError) {
      console.error('❌ Error creating retailer:', retailerError);
      return;
    }

    retailerId = newRetailer.retailer_id;
    console.log(`✅ Created retailer: ${newRetailer.name}`);
    console.log(`   Retailer ID: ${retailerId}`);
    console.log(`   Website: ${newRetailer.website_url}\n`);
  } else {
    const retailer = existingRetailers[0];
    retailerId = retailer.retailer_id;
    console.log(`✅ Found existing retailer: ${retailer.name}`);
    console.log(`   Retailer ID: ${retailerId}`);
    console.log(`   Website: ${retailer.website_url}\n`);
  }

  // Step 2: Check/Create Supermarkets
  console.log('📋 Step 2: Checking Supermarkets...\n');
  
  const { data: supermarkets } = await supabase
    .from('supermarkets')
    .select('*')
    .eq('retailer_id', retailerId);

  if (!supermarkets || supermarkets.length === 0) {
    console.log('⚠️  No supermarkets found for Intermarkt. Creating default...\n');
    
    const { data: newSupermarket, error: supermarketError } = await supabase
      .from('supermarkets')
      .insert({
        retailer_id: retailerId,
        branch_name: 'Intermarkt Main Branch',
        address: 'Mauritius',
        city: 'Port Louis',
        location: 'Mauritius',
        contact_no: null,
        latitude: -20.1609,  // Approximate center of Mauritius
        longitude: 57.5012,
        logo_url: null,
        is_active: true,
      })
      .select()
      .single();

    if (supermarketError) {
      console.error('❌ Error creating supermarket:', supermarketError);
      return;
    }

    console.log(`✅ Created supermarket: ${newSupermarket.branch_name}`);
    console.log(`   Supermarket ID: ${newSupermarket.supermarket_id}`);
    console.log(`   Address: ${newSupermarket.address || 'Not specified'}`);
    console.log(`   Active: ${newSupermarket.is_active}\n`);
    
    console.log('============================================================');
    console.log('📝 Next Steps:');
    console.log('============================================================');
    console.log(`1. Update test-intermarkt-save.ts with:`);
    console.log(`   const INTERMARKT_SUPERMARKET_ID = ${newSupermarket.supermarket_id};`);
    console.log(`\n2. Run the save test:`);
    console.log(`   npx tsx tests/intermarkt/test-intermarkt-save.ts`);
    console.log('============================================================\n');
  } else {
    console.log(`✅ Found ${supermarkets.length} supermarket(s) for Intermarkt:\n`);
    
    supermarkets.forEach((s, index) => {
      console.log(`${index + 1}. ${s.branch_name}`);
      console.log(`   Supermarket ID: ${s.supermarket_id}`);
      console.log(`   Address: ${s.address || 'Not specified'}`);
      console.log(`   Contact: ${s.contact_no || 'Not specified'}`);
      console.log(`   Active: ${s.is_active}`);
      console.log(`   Location: ${s.latitude}, ${s.longitude}\n`);
    });

    console.log('============================================================');
    console.log('📝 Next Steps:');
    console.log('============================================================');
    console.log(`1. Update test-intermarkt-save.ts with:`);
    console.log(`   const INTERMARKT_SUPERMARKET_ID = ${supermarkets[0].supermarket_id};`);
    console.log(`\n2. Run the save test:`);
    console.log(`   npx tsx tests/intermarkt/test-intermarkt-save.ts`);
    console.log('============================================================\n');
  }
}

checkIntermartDatabase().catch(console.error);
