import cron from 'node-cron';
import { IntermartScraper } from '../scraping/intermarkt/intermarkt-scraper';
import { monitorScraping, checkScraperHealth, getScraperStats } from './monitoring';
// Import other scrapers as you add them
// import { WinnersScraper } from '../scraping/winners/winners-scraper';
// import { ShopriteScraper } from '../scraping/shoprite/shoprite-scraper';

interface ScraperConfig {
  name: string;
  supermarketId: number;
  scraper: any;
  schedule: string; // cron format
  enabled: boolean;
}

// Configure all scrapers and their schedules
const scraperConfigs: ScraperConfig[] = [
  {
    name: 'Intermarkt',
    supermarketId: 25,
    scraper: IntermartScraper,
    schedule: '0 2 * * *', // Daily at 2 AM
    enabled: true
  },
  // Add more retailers here
  // {
  //   name: 'Winners',
  //   supermarketId: 4,
  //   scraper: WinnersScraper,
  //   schedule: '0 3 * * *', // Daily at 3 AM
  //   enabled: true
  // },
];

// Logging utility
function log(scraperName: string, message: string, isError: boolean = false) {
  const timestamp = new Date().toISOString();
  const level = isError ? 'ERROR' : 'INFO';
  console.log(`[${timestamp}] [${level}] [${scraperName}] ${message}`);
}

// Send alert for failures
async function sendAlert(scraperName: string, error: string): Promise<void> {
  // TODO: Implement notification system (email, Slack, SMS)
  log(scraperName, `ALERT: ${error}`, true);
  // Future: Send email, Slack, SMS, etc.
}

// Run a single scraper with monitoring
async function runScraper(config: ScraperConfig): Promise<void> {
  const { name, supermarketId, scraper: ScraperClass } = config;
  
  log(name, 'Starting scheduled scrape...');
  
  try {
    const scraper = new ScraperClass();
    
    // Calculate date range (current week's deals)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Next 7 days
    
    log(name, `Scraping deals from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    // Use monitoring wrapper
    const result = await monitorScraping(name, supermarketId, async () => {
      return await scraper.scrapeAndSave(supermarketId, startDate, endDate);
    });
    
    log(name, `Scrape completed successfully ✓ - ${result.productsCreated} products, ${result.dealsCreated} deals`);
    
    // Log stats
    const stats = await getScraperStats(name);
    if (stats) {
      log(name, `Stats: ${stats.success_rate}% success rate, ${stats.total_runs} total runs`);
    }
    
  } catch (error: any) {
    log(name, `Scrape failed: ${error.message}`, true);
    await sendAlert(name, error.message);
  }
}

// Schedule all scrapers
function scheduleScrapers() {
  console.log('============================================================');
  console.log('🤖 Starting Automated Scraper Scheduler');
  console.log('============================================================\n');
  
  scraperConfigs.forEach(config => {
    if (!config.enabled) {
      console.log(`⏸️  ${config.name}: Disabled (skipping)`);
      return;
    }
    
    console.log(`✅ ${config.name}: Scheduled for ${config.schedule}`);
    
    // Schedule the scraper
    cron.schedule(config.schedule, async () => {
      await runScraper(config);
    });
  });
  
  // Schedule health checks every 6 hours
  console.log(`🏥 Health checks: Scheduled every 6 hours (0 */6 * * *)`);
  cron.schedule('0 */6 * * *', async () => {
    await checkAllScrapersHealth();
  });
  
  console.log('\n✅ All scrapers scheduled successfully!');
  console.log('Scheduler is running. Press Ctrl+C to stop.\n');
}

// Check health of all scrapers
async function checkAllScrapersHealth() {
  console.log('\n============================================================');
  console.log('🏥 Running Health Check');
  console.log('============================================================\n');
  
  for (const config of scraperConfigs) {
    if (!config.enabled) continue;
    
    const health = await checkScraperHealth(config.name);
    const icon = health.healthy ? '✓' : '✗';
    
    log(config.name, `${icon} ${health.message}`, !health.healthy);
    
    if (!health.healthy) {
      await sendAlert(config.name, health.message);
    }
  }
  
  console.log('\n============================================================');
}

// Manual run for testing
async function runAllNow() {
  console.log('============================================================');
  console.log('🚀 Running All Scrapers Manually');
  console.log('============================================================\n');
  
  for (const config of scraperConfigs) {
    if (config.enabled) {
      await runScraper(config);
      console.log(''); // Empty line between scrapers
    }
  }
  
  // Run health check after all scrapers
  await checkAllScrapersHealth();
  
  console.log('\n============================================================');
  console.log('✅ Manual run completed!');
  console.log('============================================================');
}

// Main entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--now') || args.includes('-n')) {
    // Run all scrapers immediately
    runAllNow().then(() => process.exit(0)).catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
  } else {
    // Start scheduler
    scheduleScrapers();
  }
}

export { scheduleScrapers, runAllNow, runScraper };
