# Website Backend

Backend APIs and ML services for the PriceFind web dashboard (Next.js).

## Structure

```
website-backend/
├── api/
│   ├── forecasting/        # ML Forecasting endpoints
│   │   ├── demand.py       # Demand forecasting API
│   │   └── price.py        # Price forecasting API
│   ├── analytics/          # Analytics endpoints (future)
│   └── dashboard/          # Dashboard endpoints (future)
├── forecasting/            # ML Models & Training
│   ├── data/              # Training datasets
│   │   └── retail_sales.csv
│   ├── models/            # Trained models
│   │   ├── demand_forecaster.pkl
│   │   └── price_forecaster.pkl
│   ├── data_processor.py  # Data cleaning & preprocessing
│   ├── demand-model.py    # Facebook Prophet demand model
│   ├── price-model.py     # ARIMA + Random Forest price model
│   ├── train_models.py    # Model training pipeline
│   ├── test_forecasting.py # Testing suite
│   ├── requirements.txt   # Python dependencies
│   └── README.md
└── lib/
    └── supabase.ts        # Supabase client for website
```

## Features

### 1. Demand Forecasting (ML)
- **Algorithm**: Facebook Prophet
- **Purpose**: Predict product demand for next 7-30 days
- **Endpoint**: `GET /api/forecasting/demand`
- **Metrics**: MAPE < 15%, R² > 0.75

### 2. Price Forecasting (ML)
- **Algorithms**: ARIMA + Random Forest
- **Purpose**: Predict prices and discount patterns
- **Endpoint**: `GET /api/forecasting/price`
- **Features**: Next deal prediction, price trends

### 3. Analytics (Coming Soon)
- Sales analytics
- Customer behavior analysis
- Market trends

### 4. Dashboard APIs (Coming Soon)
- Real-time metrics
- Inventory management
- Performance tracking

## ML Setup

### Install Python Dependencies
```bash
cd website/backend/website-backend/forecasting
pip install -r requirements.txt
```

### Train Models
```bash
# Download Kaggle dataset to forecasting/data/retail_sales.csv
# OR generate sample data:
python train_models.py
# Choose 'y' to generate sample dataset
```

### Test Models
```bash
python test_forecasting.py
```

## API Endpoints

### Demand Forecasting
```bash
GET /api/forecasting/demand?days=30&top_n=10
```

**Response**:
```json
{
  "success": true,
  "forecasts": [...],
  "high_demand_alerts": [...]
}
```

### Price Forecasting
```bash
GET /api/forecasting/price?product_id=X&days=14&current_price=45
```

**Response**:
```json
{
  "success": true,
  "predictions": [...],
  "next_deal_prediction": {...}
}
```

## Environment Variables

Required in `.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

## Used By

- Next.js Website (`website/frontend/Website/`)
- Retailer Dashboard
- Admin Panel

## Tech Stack

- **Backend**: Python (Flask for API), TypeScript
- **ML Libraries**: 
  - Facebook Prophet (demand forecasting)
  - statsmodels ARIMA (price forecasting)
  - scikit-learn (Random Forest)
- **Data**: Pandas, NumPy
- **Database**: Supabase
- **Deployment**: Vercel Serverless Functions

## ML Models

### Demand Forecaster
- Type: Time Series (Prophet)
- Input: Historical sales data
- Output: 30-day demand predictions with confidence intervals

### Price Forecaster
- Type: ARIMA + Random Forest
- Input: Historical prices, dates
- Output: Price predictions, discount probabilities

## Documentation

See individual README files:
- [Forecasting README](forecasting/README.md)
- [Quick Start Guide](forecasting/QUICKSTART.md)
- [Dataset Download Guide](forecasting/DATASET_DOWNLOAD.md)
