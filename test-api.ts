/**
 * Simple test server for API endpoints
 * Run: npx tsx test-api.ts
 */

import { GET as getDealsByRetailer } from './api/deals/by-retailer';
import { GET as getNearbyDeals } from './api/deals/nearby';
import { GET as getNearbySupermarkets } from './api/supermarkets/nearby';
import './scraping/supabase-node'; // Initialize node supabase

async function testAPIs() {
  console.log('🧪 Testing API Endpoints\n');
  console.log('='.repeat(80));

  // Test 1: Get deals by retailer (Shoprite)
  console.log('\n📍 TEST 1: Get Deals by Retailer (Shoprite - ID: 5)');
  console.log('-'.repeat(80));
  
  const retailerRequest = new Request('http://localhost:3000/api/deals/by-retailer?retailer_id=5&limit=10');
  const retailerResponse = await getDealsByRetailer(retailerRequest);
  const retailerData = await retailerResponse.json();
  
  console.log(`✅ Status: ${retailerResponse.status}`);
  console.log(`📦 Deals found: ${retailerData.count}`);
  console.log(`🏷️  Categories: ${retailerData.categories?.join(', ')}`);
  
  if (retailerData.deals && retailerData.deals.length > 0) {
    console.log('\n📦 Sample Deal:');
    const sample = retailerData.deals[0];
    console.log(`   Product: ${sample.product?.name}`);
    console.log(`   Brand: ${sample.product?.brand || 'N/A'}`);
    console.log(`   Category: ${sample.product?.category || 'N/A'}`);
    console.log(`   Price: R${sample.deal_price}`);
    console.log(`   Discount: ${sample.discount || 0}%`);
  }

  // Test 2: Get nearby supermarkets (Mauritius coordinates - Port Louis)
  console.log('\n\n📍 TEST 2: Get Nearby Supermarkets');
  console.log('-'.repeat(80));
  console.log('Using Port Louis, Mauritius coordinates (-20.1609, 57.5012)');
  
  const supermarketRequest = new Request('http://localhost:3000/api/supermarkets/nearby?lat=-20.1609&lng=57.5012&radius=50');
  const supermarketResponse = await getNearbySupermarkets(supermarketRequest);
  const supermarketData = await supermarketResponse.json();
  
  console.log(`✅ Status: ${supermarketResponse.status}`);
  console.log(`🏪 Supermarkets found: ${supermarketData.count}`);
  
  if (supermarketData.supermarkets && supermarketData.supermarkets.length > 0) {
    console.log('\n🏪 Sample Supermarkets:');
    supermarketData.supermarkets.slice(0, 3).forEach((sm: any, i: number) => {
      console.log(`\n   ${i + 1}. ${sm.retailer?.name} - ${sm.branch_name}`);
      console.log(`      Address: ${sm.address || 'N/A'}`);
      console.log(`      Distance: ${sm.distance_km} km`);
      console.log(`      Contact: ${sm.contact_no || 'N/A'}`);
    });
  }

  // Test 3: Get nearby deals
  console.log('\n\n📍 TEST 3: Get Nearby Deals');
  console.log('-'.repeat(80));
  console.log('Using Port Louis, Mauritius coordinates (-20.1609, 57.5012)');
  
  const dealsRequest = new Request('http://localhost:3000/api/deals/nearby?lat=-20.1609&lng=57.5012&radius=50&limit=10');
  const dealsResponse = await getNearbyDeals(dealsRequest);
  const dealsData = await dealsResponse.json();
  
  console.log(`✅ Status: ${dealsResponse.status}`);
  console.log(`💰 Deals found: ${dealsData.count}`);
  
  if (dealsData.deals && dealsData.deals.length > 0) {
    console.log('\n💰 Sample Nearby Deals:');
    dealsData.deals.slice(0, 5).forEach((deal: any, i: number) => {
      console.log(`\n   ${i + 1}. ${deal.product?.name}`);
      console.log(`      Price: R${deal.deal_price}`);
      console.log(`      Supermarket: ${deal.supermarket?.retailer?.name} - ${deal.supermarket?.branch_name}`);
      console.log(`      Distance: ${deal.distance_km} km`);
    });
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ API Tests Complete!');
  console.log('='.repeat(80));
}

testAPIs().catch(console.error);
