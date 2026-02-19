import { runWinnersScrape } from './run-helpers';

async function main() {
  console.log('🚀 Running Winners scraper...');
  const summary = await runWinnersScrape();

  console.log('\n✅ Winners scrape finished');
  console.log(`Products created: ${summary.productsCreated}`);
  console.log(`Deals created: ${summary.dealsCreated}`);
  if (summary.extra?.brochuresSaved !== undefined) {
    console.log(`Brochures saved: ${summary.extra.brochuresSaved}`);
  }
  if (summary.errors.length) {
    console.log('Errors:', summary.errors.join('; '));
  } else {
    console.log('No errors reported.');
  }
}

main().catch((error) => {
  console.error('❌ Winners scrape failed:', error.message || error);
  process.exit(1);
});
