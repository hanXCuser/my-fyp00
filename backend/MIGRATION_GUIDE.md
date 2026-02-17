# Backend Migration Guide

## 🔄 Changes Made

Your backend has been reorganized into mobile and website areas, with shared utilities kept in the backend folder:

### Before (Old Structure)
```
backend/
├── api/
│   ├── deals/
│   ├── recommendations/
│   ├── forecasting/
│   └── supermarkets/
├── app/
├── forecasting/
├── recommendations/
├── scraping/
└── lib/
```

### After (New Structure)
```
mobile-app/
└── backend/
  └── mobile-backend/      # Mobile app APIs

website/
└── backend/
  └── website-backend/     # Website APIs + ML

backend/
├── shared/                  # Common utilities
└── [old files]             # Legacy (can be archived)
```

## 📋 File Mapping

### Mobile Backend
| Old Location | New Location |
|-------------|--------------|
| `api/deals/*` | `mobile-app/backend/mobile-backend/api/deals/*` |
| `api/recommendations/*` | `mobile-app/backend/mobile-backend/api/recommendations/*` |
| `api/supermarkets/*` | `mobile-app/backend/mobile-backend/api/supermarkets/*` |
| `recommendations/*` | `mobile-app/backend/mobile-backend/recommendations/*` |
| `lib/supabase.ts` | `mobile-app/backend/mobile-backend/lib/supabase.ts` |

### Website Backend
| Old Location | New Location |
|-------------|--------------|
| `api/forecasting/*` | `website/backend/website-backend/api/forecasting/*` |
| `forecasting/*` | `website/backend/website-backend/forecasting/*` |
| `lib/supabase-server.ts` | `website/backend/website-backend/lib/supabase.ts` |

### Shared Resources
| Old Location | New Location |
|-------------|--------------|
| `scraping/*` | `shared/scraping/*` |
| `lib/supabase-server.ts` | `shared/lib/supabase-server.ts` |
| `lib/supabase-node.ts` | `shared/lib/supabase-node.ts` |

## 🔧 Required Updates

### 1. Update Import Paths

#### In Mobile App Code
**Before:**
```typescript
const response = await fetch('/api/deals/all');
```

**After:**
```typescript
const API_URL = process.env.MOBILE_API_URL || 'http://localhost:3000';
const response = await fetch(`${API_URL}/api/deals/all`);
```

#### In Website Code
**Before:**
```typescript
const response = await fetch('/api/forecasting/demand');
```

**After:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const response = await fetch(`${API_URL}/api/forecasting/demand`);
```

### 2. Update Environment Variables

Create `.env` in each folder:

**mobile-app/backend/mobile-backend/.env**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://mobile-api.vercel.app
```

**website/backend/website-backend/.env**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://website-api.vercel.app
```

**shared/.env**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 3. Update Deployment

#### Mobile Backend
```bash
cd mobile-app/backend/mobile-backend
vercel --prod
# Sets MOBILE_API_URL=https://your-mobile-api.vercel.app
```

#### Website Backend
```bash
cd website/backend/website-backend
vercel --prod
# Sets WEBSITE_API_URL=https://your-website-api.vercel.app
```

### 4. Update Frontend API Calls

#### Mobile App (React Native)
**File**: `mobile-app/frontend/Mobile_app/lib/api.ts` (create if doesn't exist)

```typescript
const MOBILE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const dealsApi = {
  getAll: () => fetch(`${MOBILE_API_URL}/api/deals/all`),
  getByRetailer: (id: string) => fetch(`${MOBILE_API_URL}/api/deals/by-retailer?retailer_id=${id}`),
  getNearby: (lat: number, lng: number) => fetch(`${MOBILE_API_URL}/api/deals/nearby?lat=${lat}&lng=${lng}`)
};

export const recommendationsApi = {
  getForYou: (userId: string) => fetch(`${MOBILE_API_URL}/api/recommendations/for-you?user_id=${userId}`),
  getSimilar: (productId: string) => fetch(`${MOBILE_API_URL}/api/recommendations/similar?product_id=${productId}`)
};
```

#### Website (Next.js)
**File**: `website/frontend/Website/lib/api.ts`

```typescript
const WEBSITE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const forecastingApi = {
  getDemand: (days = 30) => fetch(`${WEBSITE_API_URL}/api/forecasting/demand?days=${days}`),
  getPrice: (productId: string, days = 14) => 
    fetch(`${WEBSITE_API_URL}/api/forecasting/price?product_id=${productId}&days=${days}`)
};
```

## 🚀 Deployment Steps

### Step 1: Deploy Mobile Backend
```bash
cd mobile-app/backend/mobile-backend
npm install
vercel --prod
# Save the deployed URL
```

### Step 2: Deploy Website Backend
```bash
cd website/backend/website-backend
npm install

# Train ML models first
cd forecasting
pip install -r requirements.txt
python train_models.py

# Deploy
cd ..
vercel --prod
# Save the deployed URL
```

### Step 3: Update Frontend Environment Variables
```bash
# In mobile-app/frontend/Mobile_app/.env
EXPO_PUBLIC_API_URL=https://your-mobile-api.vercel.app

# In website/frontend/Website/.env.local
NEXT_PUBLIC_API_URL=https://your-website-api.vercel.app
```

### Step 4: Test Everything
```bash
# Test mobile APIs
curl https://your-mobile-api.vercel.app/api/deals/all

# Test website APIs
curl https://your-website-api.vercel.app/api/forecasting/demand?days=7
```

## 🗑️ Cleanup (Optional)

After verifying everything works, you can archive old files:

```bash
cd backend
mkdir legacy
mv api legacy/
mv app legacy/
mv forecasting legacy/
mv recommendations legacy/
mv scraping legacy/
# Keep only: shared/ and docs in backend/ (mobile/website backends moved)
```

## ⚠️ Important Notes

1. **Don't delete old files immediately** - Test new structure first
2. **Keep environment variables secure** - Never commit `.env` files
3. **Update documentation** - Update any internal docs with new API URLs
4. **Monitor deployments** - Check Vercel logs for any errors
5. **Gradual migration** - You can run old and new backends in parallel during transition

## ✅ Verification Checklist

- [ ] Mobile backend deployed to Vercel
- [ ] Website backend deployed to Vercel
- [ ] ML models trained and working
- [ ] Mobile app connecting to new API URL
- [ ] Website connecting to new API URL
- [ ] All API endpoints responding correctly
- [ ] Environment variables set in Vercel
- [ ] Documentation updated
- [ ] Team informed of new structure

## 🆘 Troubleshooting

### "API not found" errors
- Check that API URL environment variables are set correctly
- Verify Vercel deployment succeeded
- Check API routes in `vercel.json`

### "Module not found" errors
- Run `npm install` in the respective folder
- Check import paths are correct
- Verify `tsconfig.json` is in each folder

### ML models not loading
- Ensure models are trained: `python train_models.py`
- Check that `models/` folder is included in deployment
- Verify Python dependencies in `requirements.txt`

## 📞 Need Help?

Refer to individual README files:
- [Mobile Backend README](../mobile-app/backend/mobile-backend/README.md)
- [Website Backend README](../website/backend/website-backend/README.md)
- [Shared Resources README](shared/README.md)
- [Main Structure Guide](BACKEND_STRUCTURE.md)
