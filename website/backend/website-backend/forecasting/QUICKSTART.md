# 🚀 Quick Start Guide - ML Forecasting System

## Step 1: Install Dependencies

```bash
cd website/backend/website-backend/forecasting
pip install -r requirements.txt
```

**Required packages:**
- pandas, numpy - Data processing
- scikit-learn - Machine learning
- prophet - Time series forecasting  
- statsmodels - ARIMA models
- joblib - Model serialization

## Step 2: Get Dataset

### Option A: Download from Kaggle (Recommended)
1. Go to: https://www.kaggle.com/datasets/aungpyaeap/supermarket-sales
2. Click "Download"
3. Extract and rename to `retail_sales.csv`
4. Place in: `website/backend/website-backend/forecasting/data/retail_sales.csv`

See [DATASET_DOWNLOAD.md](DATASET_DOWNLOAD.md) for detailed instructions.

### Option B: Generate Sample Dataset
```bash
python train_models.py
# Choose 'y' when prompted to generate sample data
```

## Step 3: Train Models

```bash
python train_models.py
```

This will:
- ✓ Load and process the dataset
- ✓ Train demand forecasting model (Prophet)
- ✓ Train price forecasting model (ARIMA + Random Forest)
- ✓ Save models to `models/` folder
- ✓ Show sample predictions

**Expected output:**
```
[1/5] Checking for dataset...
[2/5] Loading and processing data...
[3/5] Training demand forecasting model...
[4/5] Training price forecasting model...
[5/5] Testing models with sample predictions...
✅ TRAINING COMPLETE!
```

## Step 4: Test the Models

```bash
python test_forecasting.py
```

Verifies:
- ✓ Demand forecasts for next 30 days
- ✓ Price predictions
- ✓ Next deal predictions
- ✓ High demand alerts

## Step 5: Use the API Endpoints

### Start Local Server (for testing)
```bash
# Terminal 1 - Demand endpoint
cd website/backend/website-backend/api/forecasting
python demand.py

# Terminal 2 - Price endpoint  
python price.py
```

### Test API Calls

**Demand Forecast:**
```bash
curl "http://localhost:5001/api/forecasting/demand?days=30"
```

**Price Forecast:**
```bash
curl "http://localhost:5002/api/forecasting/price?product_id=Organic+Milk+1L&days=14&current_price=45.0"
```

## Step 6: Integrate with Frontend

The API endpoints are ready to use in your React/Next.js apps:

```typescript
// Demand forecast
const response = await fetch(
  '/api/forecasting/demand?days=30&top_n=10'
);
const { forecasts } = await response.json();

// Price forecast
const priceResponse = await fetch(
  `/api/forecasting/price?product_id=${productId}&days=14`
);
const { predictions, next_deal_prediction } = await priceResponse.json();
```

## Common Issues & Solutions

### Issue: "Module not found: prophet"
**Solution:**
```bash
pip install --upgrade pip
pip install prophet
# If fails on Windows, try: pip install prophet --no-cache-dir
```

### Issue: "Dataset not found"
**Solution:**
- Ensure file is at: `website/backend/website-backend/forecasting/data/retail_sales.csv`
- Or generate sample: `python train_models.py` and choose 'y'

### Issue: "Model not loaded"
**Solution:**
Run training first: `python train_models.py`

## File Structure

```
website/backend/website-backend/forecasting/
├── data/
│   └── retail_sales.csv          # Your Kaggle dataset
├── models/
│   ├── demand_forecaster.pkl     # Trained demand model
│   └── price_forecaster.pkl      # Trained price model
├── data_processor.py             # Data cleaning & processing
├── demand-model.py               # Demand forecasting (Prophet)
├── price-model.py                # Price forecasting (ARIMA/RF)
├── train_models.py               # Training script
├── test_forecasting.py           # Testing script
└── requirements.txt              # Python dependencies
```

## Next Steps

1. ✅ Train models with your dataset
2. ✅ Test predictions
3. ✅ Deploy to Vercel (API endpoints ready)
4. ✅ Update frontend to use real forecasts
5. 🎓 Document for your FYP report!

## For Your FYP Report

Key points to highlight:
- **ML Models Used**: Facebook Prophet, ARIMA, Random Forest
- **Dataset**: Kaggle retail sales (specify which one)
- **Metrics**: MAPE, RMSE (shown in test output)
- **Features**: Demand forecasting, price prediction, deal alerts
- **Innovation**: Combining multiple models for retail insights

Good luck! 🎯
