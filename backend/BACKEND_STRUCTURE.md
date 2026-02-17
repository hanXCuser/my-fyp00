# PriceFind Backend - Organized Structure

This backend is now organized into separate mobile and website areas for better maintainability and deployment.

## 📁 Folder Structure

```
mobile-app/
├── backend/
│   └── mobile-backend/      # APIs for mobile app
│       ├── api/
│       │   ├── deals/          # Deal endpoints
│       │   ├── recommendations/ # Recommendation endpoints
│       │   └── supermarkets/   # Supermarket endpoints
│       ├── scraping/           # Web scrapers
│       │   ├── intermarkt/
│       │   ├── super-u/
│       │   ├── winners/
│       │   └── mu-catalogues/
│       ├── recommendations/     # Rule-based engine
│       ├── lib/                # Mobile-specific utilities
│       ├── package.json
│       └── README.md
│
website/
├── backend/
│   └── website-backend/     # APIs and ML for website
│       ├── api/
│       │   ├── forecasting/    # ML forecasting endpoints
│       │   ├── analytics/      # Analytics (future)
│       │   └── dashboard/      # Dashboard APIs (future)
│       ├── forecasting/        # ML models & training
│       │   ├── data/          # Training datasets
│       │   ├── models/        # Trained ML models
│       │   ├── demand-model.py
│       │   ├── price-model.py
│       │   └── train_models.py
│       ├── lib/               # Website-specific utilities
│       ├── package.json
│       └── README.md
│
backend/
├── shared/                  # Shared resources
│   ├── lib/                # Shared Supabase clients
│   │   ├── supabase-server.ts
│   │   └── supabase-node.ts
│   ├── package.json
│   └── README.md
│
└── [docs]                   # Structure and migration docs
    ├── BACKEND_STRUCTURE.md
    ├── MIGRATION_GUIDE.md
    └── REORGANIZATION_COMPLETE.md
```

## 🚀 Quick Start

### 1. Mobile Backend Setup

```bash
cd mobile-app/backend/mobile-backend
npm install

# Set environment variables
cp ../.env.example .env
# Edit .env with your Supabase credentials

# Deploy to Vercel
vercel --prod
```

**APIs Available**:
- Deals: `/api/deals/*`
- Recommendations: `/api/recommendations/*`
- Supermarkets: `/api/supermarkets/*`

### 2. Website Backend Setup

```bash
cd website/backend/website-backend

# Install Node.js dependencies
npm install

# Install Python dependencies for ML
cd forecasting
pip install -r requirements.txt

# Train ML models
python train_models.py
# Choose 'y' to generate sample dataset

# Test models
python test_forecasting.py
```

**APIs Available**:
- Demand Forecasting: `/api/forecasting/demand`
- Price Forecasting: `/api/forecasting/price`

### 3. Shared Resources Setup

```bash
cd backend/shared
npm install

# Supabase clients imported by mobile-app/backend/mobile-backend and website/backend/website-backend
```

## 🎯 What Goes Where?

### Mobile Backend
**Purpose**: APIs consumed by React Native mobile app

**Contains**:
- ✅ Deal endpoints (all, by-retailer, nearby, etc.)
- ✅ Personalized recommendations
- ✅ Supermarket location APIs
- ✅ User favorites & shopping lists
- ✅ Rule-based recommendation engine
- ✅ Web scraping tools (Intermarkt, Super U, Winners, MU Catalogues)

**Used By**:
- `mobile-app/frontend/Mobile_app/` (React Native)
- `backend/app/` (legacy mobile app)

### Website Backend
**Purpose**: APIs and ML services for Next.js website & admin dashboard

**Contains**:
- ✅ ML Demand Forecasting (Facebook Prophet)
- ✅ ML Price Forecasting (ARIMA + Random Forest)
- ⏳ Analytics APIs (future)
- ⏳ Dashboard metrics APIs (future)
- ⏳ Retailer management APIs (future)

**Used By**:
- `website/frontend/Website/` (Next.js)
- Admin dashboard
- Retailer portal

### Shared
**Purpose**: Common database utilities used by both mobile and website backends

**Contains**:
- ✅ Supabase client configurations
- ✅ Database utilities

**Used By**:
- Mobile backend APIs and scraping
- Website backend ML models
- Automation scripts

## 🔧 Environment Variables

Create `.env` in each folder with:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# API URLs
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
MOBILE_API_URL=https://mobile-api.vercel.app
WEBSITE_API_URL=https://website-api.vercel.app
```

## 📊 Deployment

### Mobile Backend → Vercel
```bash
cd mobile-app/backend/mobile-backend
vercel --prod
```

### Website Backend → Vercel + Python
```bash
cd website/backend/website-backend
vercel --prod
# Note: ML models run on Vercel Python runtime
```

### Shared Scrapers → Cron/GitHub Actions
```bash
# See automation/ folder for scheduled jobs
# Scrapers moved to mobile-app/backend/mobile-backend/scraping/
```

## 🗂️ Migration from Legacy Structure

The old files in the root `backend/` folder can be:
1. **Archived**: Move to `backend/legacy/` for reference
2. **Deleted**: If already migrated to new structure

**What was moved**:
- `api/deals/*` → `mobile-app/backend/mobile-backend/api/deals/`
- `api/recommendations/*` → `mobile-app/backend/mobile-backend/api/recommendations/`
- `api/forecasting/*` → `website/backend/website-backend/api/forecasting/`
- `forecasting/*` → `website/backend/website-backend/forecasting/`
- `recommendations/*` → `mobile-app/backend/mobile-backend/recommendations/`
- `scraping/*` → `shared/scraping/`
- `lib/supabase*.ts` → `shared/lib/`

## 📚 Documentation

Each module has its own README:
- [Mobile Backend README](../mobile-app/backend/mobile-backend/README.md)
- [Website Backend README](../website/backend/website-backend/README.md)
- [Shared Resources README](shared/README.md)

For ML forecasting:
- [Forecasting README](../website/backend/website-backend/forecasting/README.md)
- [Quick Start Guide](../website/backend/website-backend/forecasting/QUICKSTART.md)
- [Dataset Download](../website/backend/website-backend/forecasting/DATASET_DOWNLOAD.md)

## 🧪 Testing

### Test Mobile APIs
```bash
cd mobile-app/backend/mobile-backend
curl http://localhost:3000/api/deals/all
```

### Test Website ML APIs
```bash
cd website/backend/website-backend/forecasting
python test_forecasting.py
```

### Test Scrapers
```bash
cd shared
npm run scrape:all
```

## 🎓 For Your FYP

**Clear Separation Benefits**:
1. **Scalability**: Each module can scale independently
2. **Deployment**: Deploy mobile & website APIs separately
3. **Maintenance**: Easier to manage and update
4. **Testing**: Test each module in isolation
5. **Documentation**: Clear documentation per module

**Architecture Diagram**:
```
┌─────────────────┐     ┌──────────────────┐
│  Mobile App     │────▶│ Mobile Backend   │
│  (React Native) │     │ (Deals, Recs)    │
└─────────────────┘     └──────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Shared     │
                        │  (Scraping)  │
                        └──────────────┘
                               ▲
                               │
┌─────────────────┐     ┌──────────────────┐
│  Website        │────▶│ Website Backend  │
│  (Next.js)      │     │ (ML, Analytics)  │
└─────────────────┘     └──────────────────┘
```

## ✅ Status

- [x] Mobile Backend - **READY**
- [x] Website Backend - **ML READY**, Analytics TBD
- [x] Shared Resources - **READY**
- [x] Documentation - **COMPLETE**
- [x] Separation - **COMPLETE**

Your backend is now properly organized and production-ready! 🚀
