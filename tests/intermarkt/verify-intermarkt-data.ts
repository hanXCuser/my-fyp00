import { supabase } from '../../scraping/supabase-node';

async function verifyIntermartData() {
  console.log('============================================================');
  console.log('🔍 Verifying Intermarkt Data Quality');
  console.log('============================================================\n');

  // Get Intermarkt retailer ID
  const { data: retailer } = await supabase
    .from('retailers')
    .select('retailer_id, name')
    .eq('name', 'Intermarkt')
    .single();

  if (!retailer) {
    console.log('❌ Intermarkt retailer not found');
    return;
  }

  console.log(`✅ Retailer: ${retailer.name} (ID: ${retailer.retailer_id})\n`);

  // Get total counts
  const { count: totalDeals } = await supabase
    .from('deals')
    .select('*', { count: 'only', head: true })
    .eq('retailer_id', retailer.retailer_id);

  const { count: totalProducts } = await supabase
    .from('products')
    .select('product_id, deals!inner(retailer_id)', { count: 'only', head: true })
    .eq('deals.retailer_id', retailer.retailer_id);

  console.log('📊 Summary Statistics:');
  console.log(`   Total Deals: ${totalDeals}`);
  console.log(`   Total Products: ${totalProducts}\n`);

  // Get deals with discounts
  const { data: dealsWithDiscounts, count: discountCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact' })
    .eq('retailer_id', retailer.retailer_id)
    .not('discount', 'is', null)
    .gt('discount', 0);

  console.log(`💰 Deals with Discounts: ${discountCount}`);
  
  // Get deals with original prices
  const { data: dealsWithOriginalPrices, count: originalPriceCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact' })
    .eq('retailer_id', retailer.retailer_id)
    .not('original_price', 'is', null)
    .gt('original_price', 0);

  console.log(`🏷️  Deals with Original Prices: ${originalPriceCount}\n`);

  // Get sample deals with full product info
  console.log('============================================================');
  console.log('📋 Sample Deals (First 10 with discounts):');
  console.log('============================================================\n');

  const { data: sampleDeals } = await supabase
    .from('deals')
    .select(`
      deal_id,
      title,
      deal_price,
      original_price,
      discount,
      start_date,
      end_date,
      products(name, brand, category, unit)
    `)
    .eq('retailer_id', retailer.retailer_id)
    .order('deal_id', { ascending: false })
    .limit(10);

  if (sampleDeals && sampleDeals.length > 0) {
    sampleDeals.forEach((deal, index) => {
      console.log(`${index + 1}. Deal ID: ${deal.deal_id}`);
      console.log(`   Title: ${deal.title}`);
      console.log(`   Price: Rs ${deal.deal_price}`);
      
      if (deal.original_price) {
        console.log(`   Original Price: Rs ${deal.original_price}`);
        const actualDiscount = Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100);
        console.log(`   Discount: ${deal.discount ? deal.discount + '%' : 'N/A'} (Calculated: ${actualDiscount}%)`);
      }
      
      if (deal.products) {
        console.log(`   Product Info:`);
        console.log(`     - Name: ${deal.products.name}`);
        console.log(`     - Brand: ${deal.products.brand || 'N/A'}`);
        console.log(`     - Category: ${deal.products.category || 'N/A'}`);
        console.log(`     - Unit: ${deal.products.unit || 'N/A'}`);
      }
      
      console.log(`   Valid: ${deal.start_date} to ${deal.end_date}\n`);
    });
  }

  // Check for data quality issues
  console.log('============================================================');
  console.log('⚠️  Data Quality Issues:');
  console.log('============================================================\n');

  // Check for unrealistic prices
  const { data: highPrices } = await supabase
    .from('deals')
    .select('deal_id, title, deal_price')
    .eq('retailer_id', retailer.retailer_id)
    .gt('deal_price', 10000)
    .limit(5);

  if (highPrices && highPrices.length > 0) {
    console.log(`🚨 Deals with suspiciously high prices (> Rs 10,000):`);
    highPrices.forEach(deal => {
      console.log(`   - ${deal.title}: Rs ${deal.deal_price} (ID: ${deal.deal_id})`);
    });
    console.log();
  }

  // Check for deals where original price is lower than deal price
  const { data: priceIssues } = await supabase
    .from('deals')
    .select('deal_id, title, deal_price, original_price')
    .eq('retailer_id', retailer.retailer_id)
    .not('original_price', 'is', null)
    .limit(1000);

  const invalidPrices = priceIssues?.filter(deal => 
    deal.original_price && deal.original_price < deal.deal_price
  ) || [];

  if (invalidPrices.length > 0) {
    console.log(`🚨 Deals where original price < deal price (${invalidPrices.length}):`);
    invalidPrices.slice(0, 5).forEach(deal => {
      console.log(`   - ${deal.title}: Original Rs ${deal.original_price} < Deal Rs ${deal.deal_price} (ID: ${deal.deal_id})`);
    });
    console.log();
  }

  // Check for very low prices
  const { data: lowPrices } = await supabase
    .from('deals')
    .select('deal_id, title, deal_price')
    .eq('retailer_id', retailer.retailer_id)
    .lt('deal_price', 1)
    .limit(5);

  if (lowPrices && lowPrices.length > 0) {
    console.log(`🚨 Deals with very low prices (< Rs 1):`);
    lowPrices.forEach(deal => {
      console.log(`   - ${deal.title}: Rs ${deal.deal_price} (ID: ${deal.deal_id})`);
    });
    console.log();
  }

  // Check for garbled product names
  const { data: allDeals } = await supabase
    .from('deals')
    .select('deal_id, title')
    .eq('retailer_id', retailer.retailer_id)
    .limit(100);

  const garbledNames = allDeals?.filter(deal => {
    // Check for excessive special characters or short names with many symbols
    const specialCharCount = (deal.title.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const ratio = specialCharCount / deal.title.length;
    return ratio > 0.4 || deal.title.length < 5;
  }) || [];

  if (garbledNames.length > 0) {
    console.log(`🚨 Potentially garbled product names (${garbledNames.length} out of ${allDeals?.length}):`);
    garbledNames.slice(0, 5).forEach(deal => {
      console.log(`   - "${deal.title}" (ID: ${deal.deal_id})`);
    });
    console.log();
  }

  console.log('============================================================');
  console.log('✅ Verification Complete!');
  console.log('============================================================');
}

verifyIntermartData().catch(console.error);
