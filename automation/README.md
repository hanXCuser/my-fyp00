# Automation & Monitoring System

Complete infrastructure for automated scraping, monitoring, and API serving.

## 🏗️ Architecture

```
automation/
├── scheduler.ts          # Cron-based scheduler for automated scraping
├── monitoring.ts         # Logging, health checks, and statistics
├── schema.sql           # Database schema for tracking
└── setup-database.ts    # Helper to create monitoring tables
```

## 📦 Setup

### 1. Install Dependencies
```bash
npm install node-cron @types/node-cron
```

### 2. Create Database Tables
Run this SQL in your Supabase dashboard (SQL Editor):

```sql
CREATE TABLE IF NOT EXISTS scraping_logs (
    log_id SERIAL PRIMARY KEY,
    scraper_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'partial')),
    products_scraped INTEGER DEFAULT 0,
    deals_created INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scraping_logs_scraper_name ON scraping_logs(scraper_name);
CREATE INDEX idx_scraping_logs_scraped_at ON scraping_logs(scraped_at DESC);
CREATE INDEX idx_scraping_logs_status ON scraping_logs(status);

CREATE OR REPLACE VIEW scraper_stats AS
SELECT 
    scraper_name,
    COUNT(*) as total_runs,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
    SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failed_runs,
    ROUND((SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 2) as success_rate,
    ROUND(AVG(products_scraped)) as avg_products_per_run,
    ROUND(AVG(deals_created)) as avg_deals_per_run,
    MAX(CASE WHEN status = 'success' THEN scraped_at END) as last_successful_run,
    MAX(CASE WHEN status = 'failure' THEN scraped_at END) as last_failed_run,
    MAX(scraped_at) as last_run
FROM scraping_logs
GROUP BY scraper_name;
```

## 🚀 Usage

### Run Scheduler (Production)
Runs daily at 2 AM, with health checks every 6 hours:
```bash
npx tsx automation/scheduler.ts
```

### Manual Test Run
Run all scrapers immediately:
```bash
npx tsx automation/scheduler.ts --now
# or
npx tsx automation/scheduler.ts -n
```

### API Testing
Test the API endpoints:
```bash
# All deals with filters
curl "http://localhost:3000/api/deals/all?category=Beverages&min_discount=10&limit=20"

# Best discounts
curl "http://localhost:3000/api/deals/discounts?min_discount=20"

# Categories list
curl "http://localhost:3000/api/deals/categories"
```

## 📊 Monitoring Features

### Automatic Logging
Every scraping run is automatically logged with:
- Scraper name
- Status (success/failure/partial)
- Products scraped count
- Deals created count
- Error messages (if any)
- Duration in milliseconds
- Timestamp

### Health Checks
Automated health checks run every 6 hours to detect:
- Scrapers that haven't run in 48+ hours
- Recent failures
- Abnormal patterns

### Statistics Dashboard
Query scraper performance:
```sql
-- View all scraper stats
SELECT * FROM scraper_stats ORDER BY last_run DESC;

-- Recent activity
SELECT * FROM scraping_logs ORDER BY scraped_at DESC LIMIT 20;

-- Failed runs for debugging
SELECT * FROM scraping_logs WHERE status = 'failure' ORDER BY scraped_at DESC LIMIT 10;
```

### Monitoring Functions
```typescript
import { 
  logScrapingActivity,
  getScraperStats,
  getRecentActivity,
  checkScraperHealth,
  monitorScraping
} from './automation/monitoring';

// Wrap any scraping function with monitoring
const result = await monitorScraping('Intermarkt', async () => {
  return await scraper.scrapeAndSave();
});

// Get scraper statistics
const stats = await getScraperStats('Intermarkt');
console.log(`Success rate: ${stats.success_rate}%`);

// Check health
const health = await checkScraperHealth('Intermarkt');
if (!health.healthy) {
  console.error(health.message);
}
```

## 🔔 Alerts & Notifications

Currently logs to console. To add notifications:

### Email (TODO)
```typescript
async function sendAlert(scraperName: string, error: string) {
  // Use nodemailer, SendGrid, etc.
  await sendEmail({
    to: 'admin@example.com',
    subject: `Scraper Alert: ${scraperName}`,
    body: `Scraper failed: ${error}`
  });
}
```

### Slack (TODO)
```typescript
async function sendAlert(scraperName: string, error: string) {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `🚨 ${scraperName} scraper failed: ${error}`
  });
}
```

### SMS (TODO)
```typescript
async function sendAlert(scraperName: string, error: string) {
  // Use Twilio, AWS SNS, etc.
  await sendSMS({
    to: '+1234567890',
    message: `Alert: ${scraperName} failed - ${error}`
  });
}
```

## 📡 API Endpoints

### GET /api/deals/all
Comprehensive deals endpoint with filtering, search, pagination, and sorting.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (max 100, default: 20)
- `category` (string): Filter by product category
- `retailer_id` (number): Filter by retailer
- `min_price` (number): Minimum price in Rs
- `max_price` (number): Maximum price in Rs
- `min_discount` (number): Minimum discount percentage
- `search` (string): Search in product names
- `sort` (string): Sort order
  - `price_asc` - Cheapest first
  - `price_desc` - Most expensive first
  - `discount_desc` - Best discounts first
  - `newest` - Latest deals first (default)

**Example:**
```
GET /api/deals/all?category=Beverages&min_discount=15&limit=50&sort=discount_desc
```

### GET /api/deals/discounts
Best deals sorted by discount percentage.

**Query Parameters:**
- `min_discount` (number): Minimum discount % (default: 10)
- `category` (string): Filter by category
- `retailer_id` (number): Filter by retailer

**Example:**
```
GET /api/deals/discounts?min_discount=30&category=Electronics
```

### GET /api/deals/categories
List of all available product categories with deal counts.

**Example:**
```
GET /api/deals/categories
```

## 🎯 Adding New Scrapers

1. Create scraper in `scraping/[retailer]/[retailer]-scraper.ts`
2. Add to scheduler config:

```typescript
const scraperConfigs: ScraperConfig[] = [
  {
    name: 'Intermarkt',
    supermarketId: 25,
    scraper: IntermartScraper,
    schedule: '0 2 * * *',
    enabled: true
  },
  {
    name: 'Winners',
    supermarketId: 4,
    scraper: WinnersScraper,
    schedule: '0 3 * * *',  // Different time to avoid conflicts
    enabled: true
  }
];
```

## 🐛 Debugging

### Check Recent Logs
```sql
SELECT * FROM scraping_logs 
WHERE scraper_name = 'Intermarkt' 
ORDER BY scraped_at DESC 
LIMIT 10;
```

### Check Error Patterns
```sql
SELECT 
  scraper_name,
  error_message,
  COUNT(*) as occurrences
FROM scraping_logs
WHERE status = 'failure'
GROUP BY scraper_name, error_message
ORDER BY occurrences DESC;
```

### Performance Analysis
```sql
SELECT 
  scraper_name,
  AVG(duration_ms) as avg_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  MAX(duration_ms) as max_duration_ms
FROM scraping_logs
WHERE status = 'success'
GROUP BY scraper_name;
```

## 📈 Production Deployment

### PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start scheduler
pm2 start automation/scheduler.ts --name scraper-scheduler --interpreter npx -- tsx

# Monitor
pm2 logs scraper-scheduler
pm2 monit

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "tsx", "automation/scheduler.ts"]
```

### Systemd Service
```ini
[Unit]
Description=Scraper Scheduler
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/npx tsx automation/scheduler.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🔐 Security

- Store Supabase credentials in `.env`
- Never commit `.env` to version control
- Use read-only database users for API endpoints
- Rate limit API endpoints in production
- Validate all user inputs
- Sanitize search queries to prevent SQL injection

## 📝 Best Practices

1. **Logging**: Every scraping run should use `monitorScraping()` wrapper
2. **Error Handling**: Always catch and log errors with context
3. **Health Checks**: Set appropriate thresholds (48 hours default)
4. **Scheduling**: Stagger scraper times to avoid database contention
5. **Testing**: Always test with `--now` flag before production
6. **Monitoring**: Check `scraper_stats` view regularly

## 🆘 Common Issues

### "scraping_logs table doesn't exist"
Run the SQL schema from setup section in Supabase dashboard.

### "Scraper hasn't run in X hours"
Check scheduler is running: `ps aux | grep scheduler`

### "Module not found: node-cron"
Install dependencies: `npm install node-cron @types/node-cron`

### High failure rate
Check error patterns in `scraping_logs` table and review scraper logic.
