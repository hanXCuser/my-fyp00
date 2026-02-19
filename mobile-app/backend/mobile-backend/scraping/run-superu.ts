import { runSuperUScrape } from './run-helpers';

async function main() {
  console.log('🚀 Running Super U scraper...');
  const summary = await runSuperUScrape();

  console.log('\n✅ Super U scrape finished');
  console.log(`Products created: ${summary.productsCreated}`);
  console.log(`Deals created: ${summary.dealsCreated}`);
  if (summary.errors.length) {
    console.log('Errors:', summary.errors.join('; '));
  } else {
    console.log('No errors reported.');
  }
}

main().catch((error) => {
  console.error('❌ Super U scrape failed:', error.message || error);
  process.exit(1);
});
