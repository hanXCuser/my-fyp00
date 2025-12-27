// Test Shoprite scraper - separate products from deals
// Shows what data goes to which table
// Run: node test-shoprite-separated.js

const axios = require('axios');
const cheerio = require('cheerio');

async function testShopriteSeparated() {
  console.log('🧪 Testing Shoprite - Separating Products & Deals\n');
  console.log('='.repeat(60));

  try {
    const website = 'https://www.shoprite.co.za';
    const url = '/specials';
    
    console.log(`📡 Fetching: ${website}${url}\n`);
    
    const response = await axios.get(`${website}${url}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    const products = [];
    const deals = [];
    
    $('.item-product').each((i, el) => {
      try {
        const $el = $(el);
        
        // Extract product info (for products table)
        const name = $el.find('h3.item-product__name a').first().text().trim();
        if (!name) return;
        
        const imageUrl = $el.find('.item-product__image img').first().attr('data-original-src') || 
                         $el.find('.item-product__image img').first().attr('src');
        
        // Full image URL
        const fullImageUrl = imageUrl && !imageUrl.startsWith('http') 
          ? `${website}${imageUrl}` 
          : imageUrl;
        
        // Extract price info (for deals table)
        const priceText = $el.find('.special-price__price .now').first().text().trim();
        
        // Parse price: "R21.99" or "R21<sup>.99</sup>"
        const priceMatch = priceText.match(/R?(\d+)(?:\.|<sup>\.)?(\d+)?/);
        const dealPrice = priceMatch 
          ? parseFloat(`${priceMatch[1]}.${priceMatch[2] || '00'}`)
          : null;
        
        if (!dealPrice) return;
        
        // Try to extract brand and category from name
        // Example: "Coca-Cola Original Less Sugar Soft Drink Bottle 2L"
        const nameParts = name.split(' ');
        const brand = nameParts[0]; // First word often the brand
        
        // Try to extract unit from name
        const unitMatch = name.match(/(\d+(?:\.\d+)?(?:ml|l|g|kg|mg|pack|s))/i);
        const unit = unitMatch ? unitMatch[1] : null;
        
        // Product data (goes to products table)
        const product = {
          name: name,
          brand: brand,
          category: null, // Would need catalog scraping to get this
          unit: unit,
          image_url: fullImageUrl,
          description: null, // Not available on specials page
        };
        
        // Deal data (goes to deals table)
        const deal = {
          product_name: name, // For matching (later use product_id)
          title: `${name} - Special`,
          description: `Special offer on ${name}`,
          deal_price: dealPrice,
          discount: null, // Would need original price to calculate
          start_date: new Date().toISOString().split('T')[0], // Today
          end_date: null, // Would need to scrape from pamphlet/page
          source: 'web_scraping',
        };
        
        products.push(product);
        deals.push(deal);
        
      } catch (err) {
        console.error(`Error parsing item ${i}:`, err.message);
      }
    });

    console.log(`\n📦 PRODUCTS EXTRACTED: ${products.length}`);
    console.log('='.repeat(60));
    console.log('Sample products (for products table):\n');
    
    products.slice(0, 3).forEach((product, i) => {
      console.log(`Product ${i + 1}:`);
      console.log(`  name: ${product.name}`);
      console.log(`  brand: ${product.brand}`);
      console.log(`  category: ${product.category || 'NULL'}`);
      console.log(`  unit: ${product.unit || 'NULL'}`);
      console.log(`  image_url: ${product.image_url ? product.image_url.substring(0, 60) + '...' : 'NULL'}`);
      console.log(`  description: ${product.description || 'NULL'}`);
      console.log('');
    });

    console.log('\n💰 DEALS EXTRACTED: ' + deals.length);
    console.log('='.repeat(60));
    console.log('Sample deals (for deals table):\n');
    
    deals.slice(0, 3).forEach((deal, i) => {
      console.log(`Deal ${i + 1}:`);
      console.log(`  product_name: ${deal.product_name}`);
      console.log(`  title: ${deal.title}`);
      console.log(`  deal_price: R${deal.deal_price}`);
      console.log(`  discount: ${deal.discount || 'NULL'} (need original price)`);
      console.log(`  start_date: ${deal.start_date}`);
      console.log(`  end_date: ${deal.end_date || 'NULL'} (need to scrape)`);
      console.log(`  source: ${deal.source}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ ${products.length} products ready for products table`);
    console.log(`✅ ${deals.length} deals ready for deals table`);
    console.log('\n⚠️  MISSING DATA (would need catalog scraping):');
    console.log('   - Product category (not on specials page)');
    console.log('   - Product description (not on specials page)');
    console.log('   - Original price (for discount calculation)');
    console.log('   - Deal end_date (need to find from page/pamphlet)');
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Add catalog scraping for full product info');
    console.log('   2. Extract original prices to calculate discount');
    console.log('   3. Find deal validity dates');
    console.log('   4. Implement pagination for all products');
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testShopriteSeparated();
