/**
 * Paginated Shoprite scraper - Testing with logs only
 * No database saves - just verify scraping works across pages
 */

const axios = require('axios');
const cheerio = require('cheerio');

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

      // Generate IDs
      const timestamp = Date.now();
      const productId = `PROD_${timestamp}_${pageNum}_${i}`;
      const dealId = `DEAL_${timestamp}_${pageNum}_${i}`;
      const priceHistoryId = `PRICE_${timestamp}_${pageNum}_${i}`;
      const supermarketId = 'SHOPRITE_SA';

      // PRODUCTS table data
      products.push({
        product_id: productId,
        name: name,
        brand: brand || null,
        category: null,
        unit: unit || null,
        image_url: imageUrl.startsWith('http') ? imageUrl : `https://www.shoprite.co.za${imageUrl}`,
        description: null,
        created_at: new Date().toISOString()
      });

      // DEALS table data
      deals.push({
        deal_id: dealId,
        product_id: productId,
        supermarket_id: supermarketId,
        retailer_id: null,
        pamphlet_id: null,
        title: `${name} Special`,
        description: null,
        deal_price: price,
        original_price: null,
        discount: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        source: url,
        created_at: new Date().toISOString()
      });

      // PRICE_HISTORY table data
      priceHistory.push({
        price_id: priceHistoryId,
        supermarket_id: supermarketId,
        product_id: productId,
        old_price: price,
        collected_at: new Date().toISOString(),
        source: url
      });
    });

    return { 
      products, 
      deals, 
      priceHistory,
      pageNum,
      success: true 
    };
  } catch (error) {
    console.error(`❌ Error scraping page ${pageNum}:`, error.message);
    // If it's a network error, wait and retry once
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.log(`   ⏳ Retrying page ${pageNum} in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        return await scrapePage(pageNum); // Recursive retry
      } catch (retryError) {
        console.error(`   ❌ Retry failed for page ${pageNum}`);
      }
    }
    return { 
      products: [], 
      deals: [], 
      priceHistory: [],
      pageNum,
      success: false,
      error: error.message
    };
  }
}

async function scrapeMultiplePages(startPage, endPage, delayMs = 1000) {
  console.log('🛒 Shoprite Paginated Scraper - Testing Mode');
  console.log('='.repeat(80));
  console.log(`📄 Scraping pages ${startPage} to ${endPage}`);
  console.log(`⏱️  Delay between requests: ${delayMs}ms\n`);

  const allProducts = [];
  const allDeals = [];
  const allPriceHistory = [];
  const failedPages = [];

  for (let page = startPage; page <= endPage; page++) {
    console.log(`\n📖 Scraping page ${page}...`);
    
    const result = await scrapePage(page);
    
    if (result.success) {
      allProducts.push(...result.products);
      allDeals.push(...result.deals);
      allPriceHistory.push(...result.priceHistory);
      
      console.log(`   ✅ Found ${result.products.length} products`);
      
      // Show first product from this page
      if (result.products.length > 0) {
        const sample = result.products[0];
        const sampleDeal = result.deals[0];
        console.log(`   📦 Sample: ${sample.name}`);
        console.log(`   💰 Price: R${sampleDeal.deal_price}`);
        console.log(`   🏷️  Brand: ${sample.brand || 'N/A'}`);
        console.log(`   📏 Unit: ${sample.unit || 'N/A'}`);
      }
    } else {
      failedPages.push(page);
      console.log(`   ❌ Failed to scrape page ${page}`);
    }

    // Delay before next request to be respectful
    if (page < endPage) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SCRAPING SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully scraped: ${endPage - startPage + 1 - failedPages.length} pages`);
  console.log(`❌ Failed pages: ${failedPages.length} ${failedPages.length > 0 ? `(${failedPages.join(', ')})` : ''}`);
  console.log(`\n📦 Total Products: ${allProducts.length}`);
  console.log(`💰 Total Deals: ${allDeals.length}`);
  console.log(`📊 Total Price History Records: ${allPriceHistory.length}`);

  // Price range analysis
  if (allDeals.length > 0) {
    const prices = allDeals.map(d => d.deal_price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
    
    console.log(`\n💵 Price Range:`);
    console.log(`   Min: R${minPrice}`);
    console.log(`   Max: R${maxPrice}`);
    console.log(`   Avg: R${avgPrice}`);
  }

  // Brand analysis
  if (allProducts.length > 0) {
    const brandsWithData = allProducts.filter(p => p.brand).length;
    const brandsNull = allProducts.filter(p => !p.brand).length;
    
    console.log(`\n🏷️  Brand Data:`);
    console.log(`   With brand: ${brandsWithData} (${((brandsWithData/allProducts.length)*100).toFixed(1)}%)`);
    console.log(`   No brand: ${brandsNull} (${((brandsNull/allProducts.length)*100).toFixed(1)}%)`);
  }

  // Show sample products
  console.log(`\n📦 Sample Products (first 5):`);
  allProducts.slice(0, 5).forEach((p, i) => {
    const deal = allDeals[i];
    console.log(`   ${i+1}. ${p.name} - R${deal.deal_price}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('💡 NEXT STEPS:');
  console.log('   ✅ Testing complete - scraping works!');
  console.log('   ⏭️  Ready to implement database saves');
  console.log('   📝 Need to add: ALTER TABLE deals ADD COLUMN original_price numeric;');
  console.log('='.repeat(80));

  return {
    allProducts,
    allDeals,
    allPriceHistory,
    failedPages
  };
}

// Full scrape test - all pages
const START_PAGE = 0;
const END_PAGE = 180;  // Full scrape: ~3,606 products
const DELAY_MS = 500; // 0.5 second delay (180 pages will take ~90 seconds)

scrapeMultiplePages(START_PAGE, END_PAGE, DELAY_MS)
  .then(() => {
    console.log('\n✨ Scraping test complete!');
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error.message);
  });
