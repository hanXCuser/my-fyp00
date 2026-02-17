# ML-Based Demand & Price Forecasting System

## Overview
Machine learning-powered forecasting system for retail demand and price predictions using time series analysis and regression models.

## Features
- **Demand Forecasting**: Predict product demand for next 7-30 days using Facebook Prophet
- **Price Forecasting**: Predict future prices and discount patterns using ARIMA/regression
- **Trend Analysis**: Identify seasonal patterns and market trends
- **Weather Integration**: Consider weather impact on demand (future enhancement)

## Models Used
1. **Prophet** - Facebook's time series forecasting for demand prediction
2. **ARIMA** - Autoregressive Integrated Moving Average for price trends
3. **Random Forest** - For multi-feature demand prediction

## Dataset
Using Kaggle retail datasets:
- Supermarket Sales Dataset
- Retail Sales Time Series
- Historical price and demand data

## Setup

### 1. Install Dependencies
```bash
cd website/backend/website-backend/forecasting
pip install -r requirements.txt
```

### 2. Download Dataset
Place Kaggle retail dataset in `data/` folder:
- `data/retail_sales.csv` - Main sales data
- `data/products.csv` - Product catalog
- `data/weather.csv` - Weather data (optional)

### 3. Train Models
```bash
python train_models.py
```

This will:
- Process and clean the dataset
- Train demand forecasting models
- Train price prediction models
- Save trained models to `models/` folder

### 4. Test Predictions
```bash
python test_forecasting.py
```

## API Endpoints

### Demand Forecast
**GET** `/api/forecasting/demand`

**Query Parameters:**
- `product_id` (optional): Specific product ID
- `category` (optional): Product category
- `days` (optional): Forecast horizon (default: 30)

**Response:**
```json
{
  "success": true,
  "forecast": [
    {
      "product_id": 123,
      "product_name": "Organic Milk 1L",
      "predictions": [
        {"date": "2026-01-26", "demand": 312, "confidence_lower": 280, "confidence_upper": 344},
        {"date": "2026-01-27", "demand": 325, "confidence_lower": 291, "confidence_upper": 359}
      ],
      "trend": "increasing",
      "growth_rate": 0.18
    }
  ]
}
```

### Price Forecast
**GET** `/api/forecasting/price`

**Query Parameters:**
- `product_id` (required): Product ID
- `days` (optional): Forecast horizon (default: 30)

**Response:**
```json
{
  "success": true,
  "product_id": 123,
  "current_price": 45.50,
  "predictions": [
    {"date": "2026-01-26", "price": 44.20, "discount_probability": 0.15},
    {"date": "2026-02-01", "price": 39.99, "discount_probability": 0.75}
  ],
  "next_deal_prediction": {
    "expected_date": "2026-02-01",
    "expected_discount": 12,
    "confidence": 0.82
  }
}
```

## Model Performance Metrics
- **MAPE** (Mean Absolute Percentage Error): < 15%
- **RMSE** (Root Mean Square Error): Track per category
- **R² Score**: > 0.75 for demand prediction

## File Structure
```
forecasting/
├── data/                    # Kaggle datasets
│   ├── retail_sales.csv
│   └── products.csv
├── models/                  # Trained models
│   ├── demand_prophet.pkl
│   ├── price_arima.pkl
│   └── rf_demand.pkl
├── demand-model.py         # Demand forecasting logic
├── price-model.py          # Price forecasting logic
├── train_models.py         # Model training script
├── data_processor.py       # Data cleaning & preprocessing
├── test_forecasting.py     # Testing utilities
└── README.md
```

## Usage in Mobile App

```typescript
// Get demand forecast
const response = await fetch(
  `${API_BASE}/api/forecasting/demand?category=Dairy&days=7`
);
const { forecast } = await response.json();

// Get price prediction for specific product
const priceResponse = await fetch(
  `${API_BASE}/api/forecasting/price?product_id=123&days=14`
);
const { predictions, next_deal_prediction } = await priceResponse.json();
```

## Future Enhancements
- [ ] Weather API integration for weather-based demand adjustment
- [ ] Real-time model retraining with user data
- [ ] Multi-variate forecasting (price + promotions + events)
- [ ] Anomaly detection for unusual patterns
- [ ] A/B testing for forecast accuracy
