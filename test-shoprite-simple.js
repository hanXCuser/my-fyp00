// Simple standalone test for Shoprite scraper
// Run: node test-shoprite-simple.js

const axios = require('axios');
const cheerio = require('cheerio');

async function testShoprite() {
  console.log('🧪 Testing Shoprite Scraper\n');
  console.log('='.repeat(50));

  try {
    const website = 'https://www.shoprite.co.za';
    const urls = ['/specials', '/promotions', '/catalogue', '/deals', '/weekly-specials'];
    
    let html = '';
    let successUrl = '';

    console.log('🔍 Trying to find Shoprite specials page...\n');

    for (const url of urls) {
      try {
        console.log(`  Trying: ${website}${url}`);
        const response = await axios.get(`${website}${url}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 10000,
        });
        html = response.data;
        successUrl = url;
        console.log(`  ✅ Found page at: ${url}\n`);
        break;
      } catch (error) {
        console.log(`  ❌ Not found: ${url}`);
      }
    }

    if (!html) {
      console.log('\n❌ Could not find promotions page');
      console.log('   Website may require JavaScript rendering (Puppeteer needed)');
      return;
    }

    const $ = cheerio.load(html);
    
    const selectors = {
      container: '.item-product',
      name: 'h3.item-product__name a',
      price: '.special-price__price .now',
    };

    console.log(`🔍 Searching for products with selector: ${selectors.container}`);
    
    const products = [];
    
    $(selectors.container).each((i, el) => {
      try {
        const $el = $(el);
        const name = $el.find(selectors.name).first().text().trim();
        const priceText = $el.find(selectors.price).first().text();
        const imageUrl = $el.find('.item-product__image img').first().attr('src') || 
                         $el.find('.item-product__image img').first().attr('data-original-src');
        
        if (name && priceText) {
          products.push({ name, priceText, imageUrl });
        }
      } catch (err) {
        // Skip
      }
    });

    console.log(`\n📦 Products Found: ${products.length}`);

    if (products.length > 0) {
      console.log('\n✅ Sample Products (first 3):');
      products.slice(0, 3).forEach((product, i) => {
        console.log(`\n  Product ${i + 1}:`);
        console.log(`    Name: ${product.name}`);
        console.log(`    Price Text: ${product.priceText}`);
        console.log(`    Image: ${product.imageUrl || 'Not found'}`);
      });
    } else {
      console.log('\n⚠️  No products found!');
      console.log('   Reasons:');
      console.log('   1. Page uses JavaScript/React (needs Puppeteer)');
      console.log('   2. Selectors need updating');
      console.log('   3. No specials available');
      console.log(`\n   Try opening: ${website}${successUrl} in a browser`);
      console.log('   and check if products load dynamically');
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test Complete');
  console.log('='.repeat(50));
}

testShoprite();
