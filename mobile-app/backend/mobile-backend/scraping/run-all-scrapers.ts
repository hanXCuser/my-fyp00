/**
 * Master script to run all scrapers in sequence
 * This will update the deals table with fresh data after archiving
 */

import { archiveCurrentPrices } from './archive-and-rescrape';

interface Scraper {
  name: string;
  fn: () => Promise<void>;
}

async function runAllScrapers() {
  console.log('Running all scrapers...\n');
  
  const scrapers: Scraper[] = [
    // Add your scraper imports and functions here when ready
  ];

  const results = {
    successful: [] as string[],
    failed: [] as string[],
  };

  for (const scraper of scrapers) {
    try {
      console.log(`\nRunning ${scraper.name} scraper...`);
      await scraper.fn();
      console.log(`${scraper.name} completed successfully`);
      results.successful.push(scraper.name);
    } catch (error) {
      console.error(`${scraper.name} failed:`, error);
      results.failed.push(scraper.name);
    }
  }

  return results;
}

async function main() {
  console.log('Starting archive and re-scrape process...\n');
  console.log('-'.repeat(60));
  console.log('STEP 1: Archive current prices to history');
  console.log('-'.repeat(60) + '\n');
  
  try {
    const archived = await archiveCurrentPrices();
    console.log(`\nArchived ${archived} price records`);
  } catch (error) {
    console.error('Failed to archive prices:', error);
    console.log('\nWarning: Continuing with scraping anyway...');
  }

  console.log('\n' + '-'.repeat(60));
  console.log('STEP 2: Run all scrapers to get fresh data');
  console.log('-'.repeat(60) + '\n');

  const results = await runAllScrapers();

  console.log('\n' + '-'.repeat(60));
  console.log('SUMMARY');
  console.log('-'.repeat(60));
  console.log(`Successful: ${results.successful.length}`);
  results.successful.forEach(name => console.log(`   - ${name}`));
  
  if (results.failed.length > 0) {
    console.log(`\nFailed: ${results.failed.length}`);
    results.failed.forEach(name => console.log(`   - ${name}`));
  }
  
  console.log('\nProcess complete!');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\nFatal error:', error);
      process.exit(1);
    });
}
