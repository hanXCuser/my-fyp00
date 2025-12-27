/**
 * Shoprite scraper with Supabase database integration
 * Saves products, deals, and price history to database
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapePage(pageNum) {
  const url = `https://www.shoprite.co.za/specials?page=${pageNum}`;
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(data);
    const products = [];
    const deals = [];
    const priceHistory = [];

    $('.item-product').each((i, elem) => {
      const $product = $(elem);
      
      // Extract data
      const name = $product.find('h3.item-product__name a').text().trim();
      const priceText = $product.find('.special-price__price .now').text().trim();
      const price = parseFloat(priceText.replace(/[R,\s]/g, ''));
      const imageUrl = $product.find('.item-product__image-wrapper img').attr('src') || '';
      const unit = $product.find('.item-product__unit-price').text().trim();
      const brand = $product.find('.item-product__brand').text().trim();

      if (!name || !price) return;

      const productData = {
        name: name,
        brand: brand || null,
        category: null,
        unit: unit || null,
        image_url: imageUrl.startsWith('http') ? imageUrl : `https://www.shoprite.co.za${imageUrl}`,
        description: null
      };

      products.push(productData);

      // Deal and price history will be created after product insert
      deals.push({
        name: name,
        price: price
      });
    });

    return { 
      products, 
      deals,
      pageNum,
      success: true 
    };
  } catch (error) {
    console.error(`❌ Error scraping page ${pageNum}:`, error.message);
    return { 
      products: [], 
      deals: [],
      pageNum,
      success: false,
      error: error.message
    };
  }
}

async function saveToDatabase(scrapedData, supermarketId = '1') {
  const savedProducts = [];
  const savedDeals = [];
  const savedPriceHistory = [];
  const errors = [];

  for (let i = 0; i < scrapedData.products.length; i++) {
    const productData = scrapedData.products[i];
    const dealData = scrapedData.deals[i];

    try {
      // 1. Check if product already exists (by name and image_url to avoid duplicates)
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('product_id')
        .eq('name', productData.name)
        .eq('image_url', productData.image_url)
        .single();

      let productId;

      if (existingProduct) {
        // Product exists, use existing ID
        productId = existingProduct.product_id;
        console.log(`   ♻️  Existing product: ${productData.name}`);
      } else {
        // Insert new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert([productData])
          .select('product_id')
          .single();

        if (productError) {
          errors.push({ type: 'product', data: productData, error: productError.message });
          console.error(`   ❌ Product insert failed: ${productData.name} - ${productError.message}`);
          continue;
        }

        productId = newProduct.product_id;
        savedProducts.push(newProduct);
        console.log(`   ✅ New product: ${productData.name}`);
      }

      // 2. Insert deal (using numeric supermarket_id)
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7); // Default 7 days validity
      
      const dealInsert = {
        product_id: productId,
        supermarket_id: supermarketId,
        title: `${productData.name} Special`,
        deal_price: dealData.price,
        original_price: null,
        discount: 0,
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        source: 'retailer' // We're scraping from retailer website
      };

      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert([dealInsert])
        .select()
        .single();

      if (dealError) {
        errors.push({ type: 'deal', data: dealInsert, error: dealError.message });
        console.error(`   ❌ Deal insert failed: ${dealError.message}`);
        continue;
      }

      savedDeals.push(newDeal);

      // 3. Insert price history
      const priceHistoryInsert = {
        supermarket_id: supermarketId,
        product_id: productId,
        old_price: dealData.price,
        collected_at: new Date().toISOString(),
        source: 'web_scrape' // Custom source identifier
      };

      const { data: newPriceHistory, error: priceError } = await supabase
        .from('price_history')
        .insert([priceHistoryInsert])
        .select()
        .single();

      if (priceError) {
        errors.push({ type: 'price_history', data: priceHistoryInsert, error: priceError.message });
        console.error(`   ❌ Price history insert failed: ${priceError.message}`);
        continue;
      }

      savedPriceHistory.push(newPriceHistory);

    } catch (err) {
      errors.push({ type: 'unknown', data: productData, error: err.message });
      console.error(`   ❌ Unexpected error: ${err.message}`);
    }
  }

  return {
    savedProducts,
    savedDeals,
    savedPriceHistory,
    errors
  };
}

async function scrapeAndSave(startPage, endPage, delayMs = 500) {
  console.log('🛒 Shoprite Database Scraper');
  console.log('='.repeat(80));
  console.log(`📄 Scraping pages ${startPage} to ${endPage}`);
  console.log(`💾 Saving to Supabase database\n`);

  let totalNewProducts = 0;
  let totalExistingProducts = 0;
  let totalDeals = 0;
  let totalPriceHistory = 0;
  let totalErrors = 0;
  const failedPages = [];

  for (let page = startPage; page <= endPage; page++) {
    console.log(`\n📖 Page ${page}/${endPage}...`);
    
    const scrapedData = await scrapePage(page);
    
    if (!scrapedData.success) {
      failedPages.push(page);
      console.log(`   ❌ Scraping failed`);
      continue;
    }

    if (scrapedData.products.length === 0) {
      console.log(`   ⚠️  No products found (might be beyond last page)`);
      break; // Stop if no more products
    }

    console.log(`   📦 Found ${scrapedData.products.length} products, saving to database...`);

    const result = await saveToDatabase(scrapedData);

    totalNewProducts += result.savedProducts.length;
    totalExistingProducts += (scrapedData.products.length - result.savedProducts.length);
    totalDeals += result.savedDeals.length;
    totalPriceHistory += result.savedPriceHistory.length;
    totalErrors += result.errors.length;

    console.log(`   💾 Saved: ${result.savedProducts.length} new products, ${result.savedDeals.length} deals, ${result.savedPriceHistory.length} price records`);
    if (result.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${result.errors.length}`);
    }

    // Delay before next page
    if (page < endPage) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SCRAPING & DATABASE SAVE SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Pages scraped successfully: ${endPage - startPage + 1 - failedPages.length}`);
  console.log(`❌ Failed pages: ${failedPages.length} ${failedPages.length > 0 ? `(${failedPages.join(', ')})` : ''}`);
  console.log(`\n💾 DATABASE SAVES:`);
  console.log(`   📦 New products: ${totalNewProducts}`);
  console.log(`   ♻️  Existing products: ${totalExistingProducts}`);
  console.log(`   💰 Deals: ${totalDeals}`);
  console.log(`   📊 Price history records: ${totalPriceHistory}`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log('='.repeat(80));
}

// Start scraping - adjust pages as needed
const START_PAGE = 0;
const END_PAGE = 4; // Start with 5 pages (100 products) for testing
const DELAY_MS = 500;

scrapeAndSave(START_PAGE, END_PAGE, DELAY_MS)
  .then(() => {
    console.log('\n✨ Scraping and database save complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
