import { MUCataloguesScraper } from './mu-catalogues/mu-catalogues-scraper.js';
import { BrochureOCRProcessor } from '../brochure-ocr.js';

async function main() {
  const scraper = new MUCataloguesScraper();
  const supermarkets = [
    { slug: 'winners', website: 'https://www.winners.mu', description: 'Winners Supermarket Mauritius' },
    { slug: 'intermart', website: 'https://intermartmauritius.com', description: 'Intermart Mauritius' },
    { slug: 'super-u', website: 'https://www.superu.mu', description: 'Super U Mauritius' },
  ];

  for (const market of supermarkets) {
    console.log(`\n=== Scraping ${market.slug} ===`);
    // Scrape and save catalogue info and products
    const result = await scraper.scrapeAndSave(market.slug, market.website, market.description);
    if (!result.success) {
      console.error(`Failed to scrape ${market.slug}:`, result.errors);
      continue;
    }
    // OCR step: get latest catalogue and run OCR
    const latest = await scraper.getLatestCatalogue(market.slug);
    if (latest) {
      const ocr = new BrochureOCRProcessor();
      console.log(`Running OCR for ${market.slug} brochure: ${latest.url}`);
      const products = await ocr.processBrochure(latest.url, latest.title, 5);
      console.log(`OCR extracted ${products.length} products for ${market.slug}`);
      // Optionally: Save OCR products to DB here if needed
    }
  }
  console.log('All done!');
}

main().catch(e => { console.error(e); process.exit(1); });
