// Shoprite - Complete Strategy with Original Prices
// Scrapes product detail pages to get regular prices
// Run: node test-shoprite-with-original-prices.js

const axios = require('axios');
const cheerio = require('cheerio');

// Add delay to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeProductDetail(productUrl, website) {
  try {
    await delay(500); // 500ms delay between requests
    
    const response = await axios.get(`${website}${productUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for regular price on product page
    // Try multiple selectors
    const priceSelectors = [
      '.product-price',
      '.js-product-price',
      '.price',
      '[data-product-price]',
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        const priceMatch = priceText.match(/R?(\d+)(?:\.|<sup>\.)?(\d+)?/);
        if (priceMatch) {
          return parseFloat(`${priceMatch[1]}.${priceMatch[2] || '00'}`);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.log(`    ⚠️  Could not fetch detail page: ${error.message}`);
    return null;
  }
}

async function testWithOriginalPrices() {
  console.log('🧪 SHOPRITE - COMPLETE STRATEGY (WITH ORIGINAL PRICES)');
  console.log('='.repeat(70));
  console.log('Strategy: Scrape specials + fetch product pages for regular prices\n');

  try {
    const website = 'https://www.shoprite.co.za';
    const url = '/specials';
    
    console.log(`📡 Fetching specials page: ${website}${url}...\n`);
    
    const response = await axios.get(`${website}${url}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    const productsData = [];
    const dealsData = [];
    const priceHistoryData = [];
    
    console.log('🔍 Parsing specials page...');
    console.log('⏳ Fetching product detail pages (limited to 3 for testing)...\n');
    
    // Limit to 3 products for testing
    const items = $('.item-product').slice(0, 3);
    let processed = 0;
    
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      
      try {
        const $el = $(el);
        
        // Extract name
        const nameLink = $el.find('h3.item-product__name a').first();
        const name = nameLink.text().trim();
        const productUrl = nameLink.attr('href');
        
        if (!name || !productUrl) continue;
        
        console.log(`${i + 1}. ${name}`);
        
        // Extract special price (from specials page)
        const priceText = $el.find('.special-price__price .now').first().text().trim();
        const priceMatch = priceText.match(/R?(\d+)(?:\.|<sup>\.)?(\d+)?/);
        const specialPrice = priceMatch 
          ? parseFloat(`${priceMatch[1]}.${priceMatch[2] || '00'}`)
          : null;
        
        if (!specialPrice) {
          console.log(`   ⚠️  No special price found\n`);
          continue;
        }
        
        console.log(`   Special price: R${specialPrice.toFixed(2)}`);
        
        // Fetch product detail page for regular price
        console.log(`   Fetching: ${productUrl.substring(0, 50)}...`);
        const regularPrice = await scrapeProductDetail(productUrl, website);
        
        if (regularPrice && regularPrice !== specialPrice) {
          console.log(`   ✅ Regular price: R${regularPrice.toFixed(2)}`);
          const discount = Math.round(((regularPrice - specialPrice) / regularPrice) * 100);
          console.log(`   💰 Discount: ${discount}%\n`);
        } else {
          console.log(`   ⚠️  Regular price not found or same as special\n`);
        }
        
        // Extract other details
        const imageUrl = $el.find('.item-product__image img').first().attr('data-original-src') || 
                         $el.find('.item-product__image img').first().attr('src');
        const fullImageUrl = imageUrl && !imageUrl.startsWith('http') 
          ? `${website}${imageUrl}` 
          : imageUrl;
        
        const nameParts = name.split(' ');
        const brand = nameParts.length > 1 ? nameParts[0] : null;
        const unitMatch = name.match(/(\d+(?:\.\d+)?(?:ml|l|g|kg|mg|pack|s|\ss))/i);
        const unit = unitMatch ? unitMatch[1] : null;
        
        const discount = regularPrice && regularPrice > specialPrice
          ? Math.round(((regularPrice - specialPrice) / regularPrice) * 100)
          : null;
        
        // Products table
        productsData.push({
          name,
          brand,
          category: null,
          unit,
          image_url: fullImageUrl,
          description: null,
        });
        
        // Deals table  
        dealsData.push({
          product_name: name,
          title: discount ? `${name} - ${discount}% Off` : `${name} Special`,
          description: discount 
            ? `Save ${discount}% - Was R${regularPrice.toFixed(2)}, Now R${specialPrice.toFixed(2)}`
            : `Special price on ${name}`,
          deal_price: specialPrice,
          original_price: regularPrice, // ✅ NOW WE HAVE THIS!
          discount: discount,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          source: 'web_scraping',
        });
        
        // Price history
        priceHistoryData.push({
          product_name: name,
          old_price: specialPrice,
          collected_at: new Date().toISOString(),
          source: 'web_scraping',
        });
        
        processed++;
        
      } catch (err) {
        console.error(`❌ Error parsing item ${i}:`, err.message);
      }
    }

    // ========== DISPLAY RESULTS ==========
    console.log('\n' + '='.repeat(70));
    console.log('📋 FINAL RESULTS');
    console.log('='.repeat(70));
    
    console.log(`\n📦 PRODUCTS: ${productsData.length}`);
    productsData.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}`);
      console.log(`     brand: ${p.brand}, unit: ${p.unit || 'N/A'}`);
    });
    
    console.log(`\n💰 DEALS: ${dealsData.length}`);
    dealsData.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.product_name}`);
      console.log(`     deal_price: R${d.deal_price.toFixed(2)}`);
      console.log(`     original_price: ${d.original_price ? 'R' + d.original_price.toFixed(2) : 'NULL'}`);
      console.log(`     discount: ${d.discount ? d.discount + '%' : 'NULL'}`);
    });
    
    console.log(`\n📊 PRICE_HISTORY: ${priceHistoryData.length} entries`);
    
    const dealsWithDiscount = dealsData.filter(d => d.discount).length;
    
    console.log(`\n✅ SUCCESS RATE:`);
    console.log(`   ${dealsWithDiscount}/${dealsData.length} deals have original_price & discount`);
    
    if (dealsWithDiscount > 0) {
      console.log(`\n🎉 STRATEGY WORKS! We can get original prices by scraping product pages!`);
    } else {
      console.log(`\n⚠️  Need to find correct selectors for product detail pages`);
    }
    
    console.log(`\n⚠️  NOTE: This is slow (500ms delay per product)`);
    console.log(`   For 3,606 products = ~30 minutes`);
    console.log(`   Consider: Scraping in batches, caching, or finding catalog page with regular prices`);
    console.log('='.repeat(70));

  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testWithOriginalPrices();
