// Test Shoprite Pamphlets Page
// Run: node test-shoprite-pamphlets.js

const axios = require('axios');
const cheerio = require('cheerio');

async function testPamphlets() {
  console.log('🧪 Testing Shoprite Pamphlets Page');
  console.log('='.repeat(70));
  
  try {
    const website = 'https://www.shoprite.co.za';
    const url = '/all-pamphlets';
    
    console.log(`📡 Fetching: ${website}${url}\n`);
    
    const response = await axios.get(`${website}${url}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Page size: ${response.data.length} bytes\n`);
    
    const $ = cheerio.load(response.data);
    
    // Look for pamphlet links
    console.log('🔍 Searching for pamphlets...\n');
    
    // Try different selectors for pamphlets
    const pamphlets = [];
    
    $('a').each((i, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (href && (href.includes('pamphlet') || href.includes('.pdf') || 
          text.toLowerCase().includes('pamphlet') || text.toLowerCase().includes('catalogue'))) {
        pamphlets.push({
          text: text,
          href: href,
          fullUrl: href.startsWith('http') ? href : `${website}${href}`
        });
      }
    });
    
    console.log(`📋 Found ${pamphlets.length} pamphlet-related links\n`);
    
    if (pamphlets.length > 0) {
      console.log('Sample pamphlets:');
      pamphlets.slice(0, 10).forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.text || 'No title'}`);
        console.log(`   URL: ${p.fullUrl}`);
      });
      
      console.log(`\n\n💡 NEXT STEPS:`);
      console.log(`   - Download pamphlet PDFs`);
      console.log(`   - Extract product info from PDFs (need OCR/PDF parser)`);
      console.log(`   - Or check if pamphlets have web view with product data`);
    } else {
      console.log('⚠️  No pamphlets found with standard selectors');
      console.log('\n📦 Looking for any interactive elements...\n');
      
      // Check for any images or interactive content
      $('img').slice(0, 5).each((i, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt');
        console.log(`Image ${i + 1}: ${alt || 'No alt'}`);
        console.log(`  src: ${src}\n`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log(`Status code: ${error.response.status}`);
    }
  }
}

testPamphlets();
