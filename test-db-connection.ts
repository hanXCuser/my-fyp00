import { supabase } from './lib/supabase';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Fetch all products
    console.log('📦 Fetching products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(10);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
    } else {
      console.log(`✅ Found ${products?.length || 0} products`);
      if (products && products.length > 0) {
        console.log('First 3 products:');
        products.slice(0, 3).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name} ${p.brand ? `(${p.brand})` : ''}`);
          console.log(`     Category: ${p.category || 'N/A'}`);
          console.log(`     Image: ${p.image_url ? '✓' : '✗'}`);
        });
      } else {
        console.log('⚠️  No products found in database');
      }
    }

    // Test 2: Fetch all deals
    console.log('\n💰 Fetching deals...');
    const today = new Date().toISOString().split('T')[0];
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .gte('end_date', today)
      .limit(10);

    if (dealsError) {
      console.error('❌ Error fetching deals:', dealsError);
    } else {
      console.log(`✅ Found ${deals?.length || 0} active deals`);
      if (deals && deals.length > 0) {
        console.log('First 3 deals:');
        deals.slice(0, 3).forEach((d, i) => {
          console.log(`  ${i + 1}. ${d.title}`);
          console.log(`     Price: $${d.deal_price}`);
          console.log(`     Discount: ${d.discount}%`);
          console.log(`     Valid until: ${d.end_date}`);
        });
      } else {
        console.log('⚠️  No active deals found');
      }
    }

    // Test 3: Check retailers
    console.log('\n🏪 Fetching retailers...');
    const { data: retailers, error: retailersError } = await supabase
      .from('retailers')
      .select('*');

    if (retailersError) {
      console.error('❌ Error fetching retailers:', retailersError);
    } else {
      console.log(`✅ Found ${retailers?.length || 0} retailers`);
      if (retailers && retailers.length > 0) {
        retailers.forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.name}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabaseConnection();
