// Shoprite Scraper - Three Table Strategy Test
// Products → Deals → Price History
// Run: node test-shoprite-three-tables.js

const axios = require('axios');
const cheerio = require('cheerio');

async function testShoprite() {
  console.log('🧪 SHOPRITE SCRAPER - THREE TABLE STRATEGY');
  console.log('='.repeat(70));
  console.log('Testing data extraction for: Products, Deals, Price History\n');

  try {
    const website = 'https://www.shoprite.co.za';
    const url = '/specials';
    
    console.log(`📡 Fetching: ${website}${url}...\n`);
    
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
    
    console.log('🔍 Parsing products...\n');
    
    $('.item-product').each((i, el) => {
      try {
        const $el = $(el);
        
        // Extract name
        const name = $el.find('h3.item-product__name a').first().text().trim();
        if (!name) return;
        
        // Extract image
        const imageUrl = $el.find('.item-product__image img').first().attr('data-original-src') || 
                         $el.find('.item-product__image img').first().attr('src');
        const fullImageUrl = imageUrl && !imageUrl.startsWith('http') 
          ? `${website}${imageUrl}` 
          : imageUrl;
        
        // Extract current price (deal_price)
        const priceText = $el.find('.special-price__price .now').first().text().trim();
        const priceMatch = priceText.match(/R?(\d+)(?:\.|<sup>\.)?(\d+)?/);
        const dealPrice = priceMatch 
          ? parseFloat(`${priceMatch[1]}.${priceMatch[2] || '00'}`)
          : null;
        
        if (!dealPrice) return;
        
        // Try to extract original price (for "Was" price)
        const wasPrice = $el.find('.was-price, .old-price, del, .original-price').first().text().trim();
        const wasPriceMatch = wasPrice.match(/R?(\d+)(?:\.|<sup>\.)?(\d+)?/);
        const originalPrice = wasPriceMatch 
          ? parseFloat(`${wasPriceMatch[1]}.${wasPriceMatch[2] || '00'}`)
          : null;
        
        // Calculate discount
        const discount = originalPrice && originalPrice > dealPrice
          ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
          : null;
        
        // Extract brand (first word usually)
        const nameParts = name.split(' ');
        const brand = nameParts.length > 1 ? nameParts[0] : null;
        
        // Extract unit from name (e.g., "2L", "500g", "1kg")
        const unitMatch = name.match(/(\d+(?:\.\d+)?(?:ml|l|g|kg|mg|pack|s|\ss))/i);
        const unit = unitMatch ? unitMatch[1] : null;
        
        // ========== PRODUCTS TABLE DATA ==========
        productsData.push({
          name: name,
          brand: brand,
          category: null, // Would need catalog scraping
          unit: unit,
          image_url: fullImageUrl,
          description: null, // Not on specials page
        });
        
        // ========== DEALS TABLE DATA (specials only) ==========
        // Only create deal if there's a discount OR it's on specials page
        dealsData.push({
          product_name: name, // For matching (later: product_id)
          supermarket_id: null, // Set when saving
          retailer_id: null, // Set when saving
          pamphlet_id: null,
          title: `${name} Special`,
          description: discount 
            ? `Save ${discount}% on ${name}` 
            : `Special price on ${name}`,
          deal_price: dealPrice,
          original_price: originalPrice, // NULL if no discount
          discount: discount,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null, // Would need to scrape validity
          source: 'web_scraping',
        });
        
        // ========== PRICE_HISTORY TABLE DATA ==========
        priceHistoryData.push({
          product_name: name, // For matching (later: product_id)
          supermarket_id: null, // Set when saving
          old_price: dealPrice, // Current price becomes history
          collected_at: new Date().toISOString(),
          source: 'web_scraping',
        });
        
      } catch (err) {
        console.error(`❌ Error parsing item ${i}:`, err.message);
      }
    });

    // ========== DISPLAY RESULTS ==========
    console.log('\n' + '='.repeat(70));
    console.log('📦 PRODUCTS TABLE DATA');
    console.log('='.repeat(70));
    console.log(`Total: ${productsData.length} products\n`);
    
    productsData.slice(0, 3).forEach((product, i) => {
      console.log(`Product ${i + 1}:`);
      console.log(`  name: "${product.name}"`);
      console.log(`  brand: ${product.brand || 'NULL'}`);
      console.log(`  category: ${product.category || 'NULL'}`);
      console.log(`  unit: ${product.unit || 'NULL'}`);
      console.log(`  image_url: ${product.image_url ? product.image_url.substring(0, 50) + '...' : 'NULL'}`);
      console.log(`  description: ${product.description || 'NULL'}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(70));
    console.log('💰 DEALS TABLE DATA');
    console.log('='.repeat(70));
    console.log(`Total: ${dealsData.length} deals\n`);
    
    dealsData.slice(0, 3).forEach((deal, i) => {
      console.log(`Deal ${i + 1}:`);
      console.log(`  product_name: "${deal.product_name}"`);
      console.log(`  title: "${deal.title}"`);
      console.log(`  description: "${deal.description}"`);
      console.log(`  deal_price: R${deal.deal_price.toFixed(2)}`);
      console.log(`  original_price: ${deal.original_price ? 'R' + deal.original_price.toFixed(2) : 'NULL'}`);
      console.log(`  discount: ${deal.discount ? deal.discount + '%' : 'NULL'}`);
      console.log(`  start_date: ${deal.start_date}`);
      console.log(`  end_date: ${deal.end_date || 'NULL'}`);
      console.log(`  source: ${deal.source}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(70));
    console.log('📊 PRICE_HISTORY TABLE DATA');
    console.log('='.repeat(70));
    console.log(`Total: ${priceHistoryData.length} entries\n`);
    
    priceHistoryData.slice(0, 3).forEach((entry, i) => {
      console.log(`Entry ${i + 1}:`);
      console.log(`  product_name: "${entry.product_name}"`);
      console.log(`  old_price: R${entry.old_price.toFixed(2)}`);
      console.log(`  collected_at: ${entry.collected_at}`);
      console.log(`  source: ${entry.source}`);
      console.log('');
    });

    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(70));
    console.log('📋 SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ ${productsData.length} products ready for products table`);
    console.log(`✅ ${dealsData.length} deals ready for deals table`);
    console.log(`✅ ${priceHistoryData.length} entries ready for price_history table`);
    
    const dealsWithDiscount = dealsData.filter(d => d.discount).length;
    const dealsWithoutDiscount = dealsData.length - dealsWithDiscount;
    
    console.log(`\n💡 BREAKDOWN:`);
    console.log(`   - Deals with discount (original_price set): ${dealsWithDiscount}`);
    console.log(`   - Deals without discount (original_price NULL): ${dealsWithoutDiscount}`);
    
    console.log(`\n⚠️  MISSING DATA:`);
    console.log(`   - Product categories (need catalog scraping)`);
    console.log(`   - Product descriptions (need product detail pages)`);
    console.log(`   - Deal end_date (need to find validity period)`);
    console.log(`   - More original prices (only ${dealsWithDiscount} found)`);
    
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`   1. Add original_price field to deals table in Supabase`);
    console.log(`   2. Test database saving with this data structure`);
    console.log(`   3. Add pagination to get more products`);
    console.log(`   4. Scrape catalog pages for complete product info`);
    console.log('='.repeat(70));

  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log(error.stack);
  }
}

testShoprite();
