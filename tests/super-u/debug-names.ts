import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

async function debug() {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const response = await axios.get('https://www.superu.mu/en', { httpsAgent: agent });
  const $ = cheerio.load(response.data);
  
  const first = $('.promo').first();
  const grandparent = first.parent().parent();
  
  console.log('Grandparent tag:', grandparent.prop('tagName'));
  console.log('Grandparent classes:', grandparent.attr('class'));
  console.log('\nAll text in grandparent (first 300 chars):');
  console.log(grandparent.text().trim().substring(0, 300));
  
  console.log('\n\nGrandparent children:');
  grandparent.children().each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 0) {
      console.log(`\n  [${$(elem).prop('tagName')}.${$(elem).attr('class')}]:`);
      console.log(`    ${text.substring(0, 150)}`);
    }
  });
}

debug().catch(console.error);
