import { runIntermartScrape } from './run-helpers';

async function main() {
  console.log('🚀 Running Intermart scraper...');
  const summary = await runIntermartScrape();

  console.log('\n✅ Intermart scrape finished');
  console.log(`Products created: ${summary.productsCreated}`);
  console.log(`Deals created: ${summary.dealsCreated}`);
  if (summary.errors.length) {
    console.log('Errors:', summary.errors.join('; '));
  } else {
    console.log('No errors reported.');
  }
}

main().catch((error) => {
  console.error('❌ Intermart scrape failed:', error.message || error);
  process.exit(1);
});
