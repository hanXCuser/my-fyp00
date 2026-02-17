# Shared Backend Resources

Shared database utilities and configurations used by both mobile and website backends.

## Structure

```
shared/
└── lib/
    ├── supabase-server.ts  # Supabase server client
    └── supabase-node.ts    # Supabase Node.js client
```

## Database Utilities

Shared Supabase client configurations for:
- Server-side operations
- Node.js scripts
- API endpoints

### supabase-server.ts
For Vercel serverless functions and API routes.

### supabase-node.ts
For Node.js scripts and scraping tools.

## Environment Variables

Required in `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## Used By

- **Mobile Backend**: Supabase client for APIs
- **Website Backend**: Supabase client for ML models

## Tech Stack

- TypeScript/Node.js
- Supabase (database)

## Database Schema

### Tables
- `products` - Product catalog
- `deals` - Active deals
- `supermarkets` - Store locations
- `retailers` - Retailer information
- `pamphlets` - Catalogue metadata
- `user_favourites` - User favorites
- `user_shopping_lists` - Shopping lists

## Usage

```bash
cd backend/shared
npm install

# Supabase clients are imported by:
# - mobile-app/backend/mobile-backend/api/*
# - website/backend/website-backend/api/*
# - mobile-app/backend/mobile-backend/scraping/*
```
