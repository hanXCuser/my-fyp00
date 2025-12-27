# Mauritius Supermarket Scraping System - Complete Guide

## 📋 Overview
Automated web scraping system for Mauritius supermarkets with location-based deal discovery.

## 🗂️ Project Structure
```
scraping/
├── shoprite/            # Shoprite scraper & tests
├── winners/             # Winners scraper
├── carrefour/           # Carrefour scraper
├── spar/                # Spar scraper
├── super-u/             # Super U scraper
├── database.ts          # Database service layer
├── supabase-node.ts     # Node.js Supabase client
├── types.ts             # TypeScript type definitions
├── utils.ts             # Shared utility functions
├── index.ts             # Main scraper orchestrator
├── test-simple.ts       # Quick scraper test
├── test-save-to-db.ts   # Database save test
├── scrape-all.ts        # Automated full scraping
├── check-database.sql   # Database verification queries
└── database-functions.sql # SQL functions for nearby deals
```

## 🚀 Quick Start

### 1. Database Setup
Run in Supabase SQL Editor:
```sql
-- First, check existing retailers
SELECT retailer_id, name FROM retailers;

-- Add supermarket branches (use actual retailer_ids from above)
INSERT INTO supermarkets (retailer_id, branch_name, address, city, location, latitude, longitude, is_active) 
VALUES
(30, 'Shoprite Trianon', 'Trianon Shopping Park', 'Quatre Bornes', 'Plaines Wilhems', -20.2528, 57.5200, true),
(30, 'Shoprite Bagatelle', 'Bagatelle Mall', 'Moka', 'Moka', -20.2398, 57.4940, true);

-- Create nearby deals function
-- See database-functions.sql
```

### 2. Test Scrapers
```bash
# Test single scraper
npm run test:scraper

# Test database save
npm run test:save-db

# Run full scraping
npm run scrape:all
```

## 📡 API Endpoints

### Nearby Deals
```typescript
GET /api/deals/nearby?lat=-20.2528&lng=57.5200&radius=10&limit=50
```

### Deals by Retailer
```typescript
GET /api/deals/by-retailer?retailer=Shoprite&supermarket_id=1
```

### Nearby Supermarkets
```typescript
GET /api/supermarkets/nearby?lat=-20.2528&lng=57.5200&radius=20&retailer=Shoprite
```

## ⏰ Automated Scheduling

### GitHub Actions (Recommended)
```yaml
# .github/workflows/scrape.yml
name: Daily Scraping
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run scrape:all
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_KEY }}
```

## 🗺️ Map Integration
Uses Haversine formula for distance calculation:
- Stores latitude/longitude per branch
- Calculates distance in km
- Sorts results by proximity
- Enables turn-by-turn navigation

## 🔧 Troubleshooting

**No supermarket branches found:**
```sql
SELECT * FROM supermarkets WHERE retailer_id = X;
```

**Scraper returns 0 products:**
- Website structure may have changed
- Update selectors in scraper files

**Database save fails:**
- Check `.env` credentials
- Verify foreign key constraints
- Ensure retailer/supermarket exist

## 📦 Next Steps
- [ ] Add more Mauritius store locations
- [ ] Implement price history tracking
- [ ] Add product search functionality
- [ ] Set up push notifications
- [ ] Enable price comparison
