/**
 * Final Shoprite scraper - Option A approach
 * Saves special prices without original prices
 * Builds price history through repeated scraping
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeShoprite(pageNum = 0) {
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

      // Generate IDs (in real implementation, these would come from database after insert)
      const productId = `PROD_${Date.now()}_${i}`;
      const dealId = `DEAL_${Date.now()}_${i}`;
      const priceHistoryId = `PRICE_${Date.now()}_${i}`;
      const supermarketId = 'SHOPRITE_SA'; // You'll need to create this in your supermarkets table

      // PRODUCTS table - static product info
      products.push({
        product_id: productId,
        name: name,
        brand: brand || null,
        category: null, // Not available from specials page
        unit: unit || null,
        image_url: imageUrl.startsWith('http') ? imageUrl : `https://www.shoprite.co.za${imageUrl}`,
        description: null, // Not available from specials page
        created_at: new Date().toISOString()
      });

      // DEALS table - temporal pricing with deal info
      deals.push({
        deal_id: dealId,
        product_id: productId,
        supermarket_id: supermarketId,
        retailer_id: null, // Shoprite doesn't have multiple retailers
        pamphlet_id: null, // No pamphlet scraping
        title: `${name} Special`, // Generic title
        description: null,
        deal_price: price,
        original_price: null, // ⚠️ NULL - will build history over time
        discount: null, // ⚠️ NULL - can't calculate without original price
        start_date: new Date().toISOString().split('T')[0], // Today
        end_date: null, // Not specified on page
        source: url,
        created_at: new Date().toISOString()
      });

      // PRICE_HISTORY table - track price changes over time
      priceHistory.push({
        price_id: priceHistoryId,
        supermarket_id: supermarketId,
        product_id: productId,
        old_price: price, // Save current price
        collected_at: new Date().toISOString(),
        source: url
      });
    });

    return { products, deals, priceHistory };
  } catch (error) {
    console.error('Error scraping:', error.message);
    return { products: [], deals: [], priceHistory: [] };
  }
}

// Test with first page
(async () => {
  console.log('🛒 Shoprite Scraper - Final Version (Option A)');
  console.log('='.repeat(80));
  console.log('📌 Strategy: Save special prices without original prices');
  console.log('📌 Build price history through repeated scraping over time\n');

  const { products, deals, priceHistory } = await scrapeShoprite(0);

  console.log(`✅ Scraped ${products.length} products from page 0\n`);

  // Show sample data
  if (products.length > 0) {
    console.log('📦 Sample Product:');
    console.log(JSON.stringify(products[0], null, 2));
    
    console.log('\n💰 Sample Deal:');
    console.log(JSON.stringify(deals[0], null, 2));
    
    console.log('\n📊 Sample Price History:');
    console.log(JSON.stringify(priceHistory[0], null, 2));
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 NEXT STEPS:');
  console.log('   1. Add original_price field to deals table (nullable)');
  console.log('      ALTER TABLE deals ADD COLUMN original_price numeric;');
  console.log('   2. Scrape all pages (0-180) to get all ~3,606 products');
  console.log('   3. Save data to Supabase database');
  console.log('   4. Re-scrape weekly to build price history');
  console.log('   5. Calculate discounts when price increases detected');
  console.log('='.repeat(80));
})();
