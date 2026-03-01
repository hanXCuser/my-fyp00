# Price History Tracking Guide

## Overview
Your application now has **automatic price history tracking** to compare old vs new deal prices for forecasting and analysis.

## Implementation: Three-Layer Approach

### ✅ **Layer 1: Manual Bulk Archive** (Already Working)
- **Location**: `archive-and-rescrape.ts`
- **Trigger**: Runs before `scrape:all` command
- **Purpose**: Archives ALL current deal prices before bulk scraping
- **Use Case**: Scheduled scraping jobs, full data refreshes

```typescript
// Automatically called by run-all-scrapers.ts
const archived = await archiveCurrentPrices();
console.log(`Archived ${archived} price records`);
```

### ✅ **Layer 2: Application-Level Auto-Archive** (Just Added)
- **Location**: `database.ts` → `upsertDeal()` method
- **Trigger**: Automatically when ANY deal price changes
- **Purpose**: Real-time archiving during individual deal updates
- **Use Case**: Single scraper runs, API updates, manual price changes

```typescript
// Happens automatically in DatabaseService.upsertDeal()
if (existing.deal_price !== deal.deal_price) {
  await this.archiveDealPrice(...); // Archives old price
  // Then updates with new price
}
```

### 🔵 **Layer 3: Database Trigger** (Optional, Recommended)
- **Location**: `price-history-trigger.sql`
- **Trigger**: PostgreSQL BEFORE UPDATE trigger on `deals` table
- **Purpose**: Database-level safeguard, catches ALL updates even outside scrapers
- **Use Case**: Manual database updates, third-party integrations

**To Enable**: Run the SQL in Supabase SQL Editor:
```bash
# Copy the content of price-history-trigger.sql
# Paste and execute in: Supabase Dashboard → SQL Editor
```

## How It Works

### Scenario 1: Scheduled Scraping (All Layers)
```
1. run-all-scrapers.ts runs
2. Layer 1: Bulk archives ALL current prices (574 deals)
3. Scrapers run and update deals
4. Layer 2: Archives price for EACH changed deal individually
5. Layer 3: Database trigger (if enabled) catches any missed updates
```

### Scenario 2: Single Scraper Run
```
1. npm run scrape:superu
2. Layer 2: Auto-archives each price change during scraping
3. Layer 3: Database trigger (if enabled) provides backup
```

### Scenario 3: Manual Database Update
```
1. Someone updates a deal price directly in Supabase
2. Layer 3: Database trigger automatically archives old price
   (Layer 2 won't run since it's not through the application)
```

## Price History Schema

```typescript
interface PriceHistory {
  history_id: number;        // Auto-generated
  product_id: number;        // Which product
  supermarket_id: number;    // Which location
  old_price: number;         // Previous price
  collected_at: timestamp;   // When archived
  source: string;            // 'scraping', 'trigger', etc.
}
```

## Querying Price History

### Get price trend for a product
```sql
SELECT 
  p.name,
  s.branch_name,
  ph.old_price,
  ph.collected_at,
  ph.source
FROM price_history ph
JOIN products p ON p.product_id = ph.product_id
JOIN supermarkets s ON s.supermarket_id = ph.supermarket_id
WHERE ph.product_id = 134
ORDER BY ph.collected_at DESC
LIMIT 10;
```

### Compare current vs historical prices
```sql
SELECT 
  p.name,
  d.deal_price as current_price,
  ph.old_price,
  ph.collected_at,
  (d.deal_price - ph.old_price) as price_change,
  ROUND((d.deal_price - ph.old_price) / ph.old_price * 100, 2) as percent_change
FROM deals d
JOIN products p ON p.product_id = d.product_id
LEFT JOIN LATERAL (
  SELECT old_price, collected_at
  FROM price_history
  WHERE product_id = d.product_id 
    AND supermarket_id = d.supermarket_id
  ORDER BY collected_at DESC
  LIMIT 1
) ph ON true
WHERE d.supermarket_id = 1;
```

## Benefits

### 1. **Price Forecasting**
- Track price fluctuations over time
- Predict future price drops
- Notify users when prices decrease

### 2. **Deal Intelligence**
- Identify "best time to buy"
- Compare price trends across retailers
- Detect pricing patterns (weekly/monthly cycles)

### 3. **User Features**
- Price drop alerts
- Historical price charts
- "Lowest price in 30 days" badges

### 4. **Analytics**
- Average price analysis
- Price volatility metrics
- Retailer pricing strategies

## Recommendations

### ✅ **Minimum Setup** (Current)
- Layer 1: Manual bulk archive ✓ (Already working)
- Layer 2: Application-level ✓ (Just implemented)

### 🌟 **Recommended Setup** (Best Practice)
- Layer 1: Manual bulk archive ✓
- Layer 2: Application-level ✓
- Layer 3: Database trigger ✓ (Run price-history-trigger.sql)

**Run the database trigger for complete peace of mind!**

## Testing

### Test Application-Level Archiving
```bash
# Run a scraper - watch for "📊 Archived old price" messages
npm run scrape:superu
```

### Test Database Trigger (after installing)
```sql
-- Update a deal price manually
UPDATE deals 
SET deal_price = 99.99 
WHERE deal_id = 661;

-- Verify it was archived
SELECT * FROM price_history 
WHERE product_id = (SELECT product_id FROM deals WHERE deal_id = 661)
ORDER BY collected_at DESC 
LIMIT 1;
```

## Troubleshooting

### No prices being archived?
1. Check Layer 2: Look for "📊 Archived old price" in scraper output
2. Check Layer 3: Verify trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'archive_price_on_deal_update';
   ```

### Duplicate archives?
- This is normal! Layers 2 & 3 may both archive (double safety)
- Layer 1 archives ALL prices upfront
- You can deduplicate with queries if needed

### Performance concerns?
- Archiving is lightweight (single INSERT per price change)
- Layer 1 uses batching (100 records at a time)
- No noticeable performance impact on scrapers

## Next Steps

1. ✅ Keep using `npm run scrape:all` for scheduled scraping
2. ✅ Individual scrapers now auto-archive price changes
3. 🔵 **Recommended**: Install database trigger for complete coverage
4. 📊 Build UI features using price_history data (charts, alerts, etc.)
