// Check what HTML we're actually getting
const axios = require('axios');
const fs = require('fs');

async function checkHTML() {
  try {
    const response = await axios.get('https://www.shoprite.co.za/specials', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });
    
    fs.writeFileSync('shoprite-page.html', response.data);
    console.log('✅ HTML saved to shoprite-page.html');
    console.log(`📄 File size: ${response.data.length} bytes`);
    console.log('\nOpen the file to inspect the HTML structure');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkHTML();
