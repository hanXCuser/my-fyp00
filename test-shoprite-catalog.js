// Test Shoprite Catalog Scraping - Get Regular Prices
// This will scrape category pages to find regular (non-special) prices
// Run: node test-shoprite-catalog.js

const axios = require('axios');
const cheerio = require('cheerio');

async function testCatalog() {
  console.log('🧪 SHOPRITE CATALOG SCRAPER - Regular Prices');
  console.log('='.repeat(70));
  
  try {
    const website = 'https://www.shoprite.co.za';
    
    // Try different catalog URLs
    const catalogUrls = [
      '/All-Departments/Food',
      '/All-Departments/Food/Fresh-Food',
      '/All-Departments/Food/Food-Cupboard',
      '/browse/c/all-departments',
    ];
    
    console.log('🔍 Searching for catalog pages...\n');
    
    let found = false;
    
    for (const url of catalogUrls) {
      try {
        console.log(`  Trying: ${url}`);
        const response = await axios.get(`${website}${url}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000,
        });
        
        const $ = cheerio.load(response.data);
        
        // Check if products exist
        const products = $('.item-product').length;
        
        console.log(`    Products found: ${products}`);
        
        if (products > 0) {
          console.log(`    ✅ Found catalog at: ${url}\n`);
          found = true;
          
          // Parse a few products
          console.log('📦 Sample Catalog Products:\n');
          
          $('.item-product').slice(0, 5).each((i, el) => {
            const $el = $(el);
            const name = $el.find('h3.item-product__name a').first().text().trim();
            const priceText = $el.find('.special-price__price .now, .price').first().text().trim();
            const priceMatch = priceText.match(/R?(\d+)(?:\.|<sup>\.)?(\d+)?/);
            const price = priceMatch ? parseFloat(`${priceMatch[1]}.${priceMatch[2] || '00'}`) : null;
            
            if (name && price) {
              console.log(`  ${i + 1}. ${name}`);
              console.log(`     Price: R${price.toFixed(2)}`);
              console.log('');
            }
          });
          
          break;
        } else {
          console.log(`    ❌ No products found\n`);
        }
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}\n`);
      }
    }
    
    if (!found) {
      console.log('\n⚠️  Could not find catalog pages with standard URLs');
      console.log('   Need to inspect website structure manually');
      console.log('\n💡 Suggestions:');
      console.log('   1. Open https://www.shoprite.co.za in browser');
      console.log('   2. Navigate to "Browse" or category sections');
      console.log('   3. Copy the URL of any category page');
      console.log('   4. Update the catalogUrls array above');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testCatalog();
