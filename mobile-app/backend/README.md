# Mobile Backend

Backend APIs and services for the PriceFind mobile application (React Native).

## Structure

```
mobile-backend/
├── api/
│   ├── deals/              # Deal-related endpoints
│   │   ├── all.ts          # GET all deals
│   │   ├── by-retailer.ts  # GET deals by retailer
│   │   ├── categories.ts   # GET deal categories
│   │   ├── discounts.ts    # GET deals by discount range
│   │   └── nearby.ts       # GET deals near location
│   ├── recommendations/    # Recommendation endpoints
│   │   ├── for-you.ts      # Personalized recommendations
│   │   ├── similar.ts      # Similar products
│   │   ├── smart-deals.ts  # Smart shopping list suggestions
│   │   └── trending.ts     # Trending deals
│   └── supermarkets/       # Supermarket endpoints
│       └── nearby.ts       # GET supermarkets near location
├── scraping/               # Web scraping tools
│   ├── intermarkt/        # Intermarkt scraper
│   ├── super-u/           # Super U scraper
│   ├── winners/           # Winners scraper
│   ├── mu-catalogues/     # Catalogue scraper
│   ├── run-all-scrapers.ts
│   ├── database.ts
│   └── utils.ts
├── recommendations/        # Recommendation engine
│   ├── rule-based-engine.ts
│   └── README.md
└── lib/
    └── supabase.ts        # Supabase client for mobile

```

## API Endpoints

### Deals
- `GET /api/deals/all` - Fetch all active deals
- `GET /api/deals/by-retailer?retailer_id=X` - Deals from specific retailer
- `GET /api/deals/categories` - Get all deal categories
- `GET /api/deals/discounts?min=X&max=Y` - Deals by discount range
- `GET /api/deals/nearby?lat=X&lng=Y` - Deals near location

### Recommendations
- `GET /api/recommendations/for-you?user_id=X` - Personalized deals
- `GET /api/recommendations/similar?product_id=X` - Similar products
- `GET /api/recommendations/trending` - Trending deals
- `GET /api/recommendations/smart-deals?user_id=X` - Shopping list suggestions

### Supermarkets
- `GET /api/supermarkets/nearby?lat=X&lng=Y` - Nearby supermarkets

## Setup

```bash
cd mobile-app/backend/mobile-backend
npm install
```

## Deploy to Vercel

```bash
vercel --prod
```

## Environment Variables

Required in `.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

## Used By

- React Native Mobile App (`mobile-app/frontend/Mobile_app/`)
- Mobile app in `backend/app/` (legacy)

## Scraping

Automated web scrapers collect product deals from Mauritius retailers:

### Supported Retailers
- **Intermarkt** - Supermarket chain
- **Super U** - French supermarket
- **Winners** - Retail store
- **MU Catalogues** - Catalogue aggregator

### Run Scrapers
```bash
cd scraping
npm run scrape:all
```

## Tech Stack

- TypeScript
- Vercel Serverless Functions
- Supabase
- Rule-based recommendation engine
- Puppeteer (web scraping)
- Tesseract.js (OCR for catalogues)
