"""
Price Forecasting Model using ARIMA and Random Forest
Predicts future prices and discount patterns
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
import joblib
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')


class PriceForecaster:
    """Forecast product prices and discount patterns"""
    
    def __init__(self):
        self.price_models = {}  # ARIMA models per product
        self.discount_model = None  # RF model for discount probability
        self.trend_model = None  # Linear regression for price trends
        # ...existing code...
    def train_price_model(self, df: pd.DataFrame, product_name: str) -> None:
        # ...existing code...
        ts_data = df.set_index('date')['unit_price'].asfreq('D')
        ts_data = ts_data.ffill()  # Forward fill missing prices
        if len(ts_data) < 30:  # Skip if insufficient data
            return
        try:
            model = ARIMA(ts_data, order=(1, 1, 1))
            fitted_model = model.fit()
            self.price_models[product_name] = fitted_model
        except Exception as e:
            print(f"Warning: Could not train price model for {product_name}: {str(e)}")
    def train_discount_predictor(self, df: pd.DataFrame) -> None:
        # ...existing code...
        features = []
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['week_of_year'] = df['date'].dt.isocalendar().week
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = (df['day_of_month'] <= 7).astype(int)
        df['is_month_end'] = (df['day_of_month'] >= 24).astype(int)
        if 'unit_price' in df.columns:
            df['price_category'] = pd.qcut(df['unit_price'], q=4, labels=[0, 1, 2, 3], duplicates='drop')
        df['has_discount'] = ((df['unit_price'] < df['unit_price'].quantile(0.75)) & 
                             (df['unit_price'] > 0)).astype(int)
        feature_cols = ['day_of_week', 'day_of_month', 'month', 'week_of_year', 
                       'is_weekend', 'is_month_start', 'is_month_end']
        if 'price_category' in df.columns:
            feature_cols.append('price_category')
        X = df[feature_cols].fillna(0)
        y = df['has_discount']
        self.discount_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.discount_model.fit(X, y)
        print("✓ Discount prediction model trained")
    def predict_price(self, product_name: str, days: int = 30) -> pd.DataFrame:
        # ...existing code...
        if product_name not in self.price_models:
            raise ValueError(f"No price model found for product: {product_name}")
        model = self.price_models[product_name]
        forecast = model.forecast(steps=days)
        last_date = model.data.dates[-1]
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=days, freq='D')
        result = pd.DataFrame({
            'date': future_dates,
            'predicted_price': forecast.values.clip(min=0)
        })
        return result
    def predict_discount_probability(self, future_dates: pd.DatetimeIndex) -> np.ndarray:
        # ...existing code...
        if self.discount_model is None:
            raise ValueError("Discount model not trained")
        df = pd.DataFrame({'date': future_dates})
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['week_of_year'] = df['date'].dt.isocalendar().week
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = (df['day_of_month'] <= 7).astype(int)
        df['is_month_end'] = (df['day_of_month'] >= 24).astype(int)
        df['price_category'] = 1
        feature_cols = ['day_of_week', 'day_of_month', 'month', 'week_of_year',
                       'is_weekend', 'is_month_start', 'is_month_end', 'price_category']
        X = df[feature_cols]
        probabilities = self.discount_model.predict(X)
        return np.clip(probabilities, 0, 1)
    def predict_next_deal(self, product_name: str, days: int = 60, 
                         current_price: Optional[float] = None) -> Dict:
        # ...existing code...
        try:
            price_forecast = self.predict_price(product_name, days=days)
        except ValueError:
            return self._simple_deal_prediction(days, current_price)
        discount_probs = self.predict_discount_probability(price_forecast['date'])
        price_forecast['discount_probability'] = discount_probs
        price_forecast['deal_score'] = (
            discount_probs * (1 - (price_forecast['predicted_price'] / price_forecast['predicted_price'].max()))
        )
        best_deal_idx = price_forecast['deal_score'].idxmax()
        best_deal = price_forecast.iloc[best_deal_idx]
        if current_price:
            expected_discount = max(0, (current_price - best_deal['predicted_price']) / current_price * 100)
        else:
            expected_discount = 15
        return {
            'expected_date': best_deal['date'].strftime('%Y-%m-%d'),
            'expected_price': round(float(best_deal['predicted_price']), 2),
            'expected_discount': round(expected_discount, 1),
            'confidence': round(float(best_deal['discount_probability']), 2),
            'days_until_deal': (best_deal['date'] - pd.Timestamp.now()).days
        }
    def _simple_deal_prediction(self, days: int, current_price: Optional[float]) -> Dict:
        today = pd.Timestamp.now()
        future_dates = pd.date_range(start=today, periods=days, freq='D')
        for date in future_dates:
            if date.day <= 7 or date.day >= 24:
                expected_price = current_price * 0.85 if current_price else None
                return {
                    'expected_date': date.strftime('%Y-%m-%d'),
                    'expected_price': round(expected_price, 2) if expected_price else None,
                    'expected_discount': 15,
                    'confidence': 0.5,
                    'days_until_deal': (date - today).days
                }
        return {
            'expected_date': None,
            'expected_price': None,
            'expected_discount': 0,
            'confidence': 0,
            'days_until_deal': None
        }
    def get_price_trend(self, df: pd.DataFrame, product_name: str) -> Dict:
        product_df = df[df['product_name'] == product_name].copy()
        if len(product_df) < 2:
            return {'trend': 'unknown', 'change': 0}
        product_df['days'] = (product_df['date'] - product_df['date'].min()).dt.days
        X = product_df[['days']].values
        y = product_df['unit_price'].values
        model = LinearRegression()
        model.fit(X, y)
        slope = model.coef_[0]
        first_price = product_df['unit_price'].iloc[0]
        last_price = product_df['unit_price'].iloc[-1]
        pct_change = ((last_price - first_price) / first_price) * 100
        trend = 'increasing' if slope > 0.01 else 'decreasing' if slope < -0.01 else 'stable'
        return {
            'trend': trend,
            'change_pct': round(pct_change, 2),
            'current_price': round(float(last_price), 2),
            'avg_price': round(float(product_df['unit_price'].mean()), 2),
            'min_price': round(float(product_df['unit_price'].min()), 2),
            'max_price': round(float(product_df['unit_price'].max()), 2)
        }
    def save_models(self, filepath: str) -> None:
        model_data = {
            'price_models': self.price_models,
            'discount_model': self.discount_model,
            'trend_model': self.trend_model
        }
        joblib.dump(model_data, filepath)
        print(f"✓ Price models saved to {filepath}")
    def load_models(self, filepath: str) -> None:
        model_data = joblib.load(filepath)
        self.price_models = model_data.get('price_models', {})
        self.discount_model = model_data.get('discount_model')
        self.trend_model = model_data.get('trend_model')
        print(f"✓ Price models loaded from {filepath}")
