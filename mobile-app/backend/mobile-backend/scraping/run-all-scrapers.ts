/**
 * Master script to run all scrapers in sequence
 * This will update the deals table with fresh data after archiving
 */

import { archiveCurrentPrices } from './archive-and-rescrape';
import { runIntermartScrape, runSuperUScrape, runWinnersScrape, ScrapeSummary } from './run-helpers';

interface ScraperEntry {
  name: string;
  runner: () => Promise<ScrapeSummary>;
}

interface ScrapeResults {
  successful: ScrapeSummary[];
  failed: { name: string; error: string }[];
}

async function runAllScrapers(): Promise<ScrapeResults> {
  console.log('Running all scrapers...\n');

  const scrapers: ScraperEntry[] = [
    { name: 'Intermart', runner: runIntermartScrape },
    { name: 'Super U', runner: runSuperUScrape },
    { name: 'Winners', runner: runWinnersScrape },
  ];

  const results: ScrapeResults = { successful: [], failed: [] };

  for (const scraper of scrapers) {
    try {
      console.log(`\nRunning ${scraper.name} scraper...`);
      const summary = await scraper.runner();
      console.log(`${scraper.name} completed successfully`);
      results.successful.push(summary);
    } catch (error: any) {
      const message = error?.message || String(error);
      console.error(`${scraper.name} failed:`, message);
      results.failed.push({ name: scraper.name, error: message });
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
  results.successful.forEach(summary => {
    console.log(`   - ${summary.retailer}: ${summary.productsCreated} products / ${summary.dealsCreated} deals`);
    if (summary.extra) {
      Object.entries(summary.extra).forEach(([key, value]) => {
        console.log(`       ${key}: ${value}`);
      });
    }
    if (summary.errors.length) {
      console.log(`       Errors: ${summary.errors.join('; ')}`);
    }
  });

  if (results.failed.length > 0) {
    console.log(`\nFailed: ${results.failed.length}`);
    results.failed.forEach(item => console.log(`   - ${item.name}: ${item.error}`));
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
