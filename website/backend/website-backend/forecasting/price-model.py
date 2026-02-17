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
        
    def train_price_model(self, df: pd.DataFrame, product_name: str) -> None:
        """
        Train ARIMA model for price forecasting
        
        Args:
            df: DataFrame with 'date' and 'unit_price' columns
            product_name: Product identifier
        """
        # Prepare time series data
        ts_data = df.set_index('date')['unit_price'].asfreq('D')
        ts_data = ts_data.fillna(method='ffill')  # Forward fill missing prices
        
        if len(ts_data) < 30:  # Skip if insufficient data
            return
        
        try:
            # Fit ARIMA model (p=1, d=1, q=1 as baseline)
            model = ARIMA(ts_data, order=(1, 1, 1))
            fitted_model = model.fit()
            
            self.price_models[product_name] = fitted_model
            
        except Exception as e:
            print(f"Warning: Could not train price model for {product_name}: {str(e)}")
    
    def train_discount_predictor(self, df: pd.DataFrame) -> None:
        """
        Train Random Forest model to predict discount probability
        
        Args:
            df: DataFrame with price history and discount information
        """
        # Feature engineering
        features = []
        
        # Time-based features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['week_of_year'] = df['date'].dt.isocalendar().week
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = (df['day_of_month'] <= 7).astype(int)
        df['is_month_end'] = (df['day_of_month'] >= 24).astype(int)
        
        # Price-based features
        if 'unit_price' in df.columns:
            df['price_category'] = pd.qcut(df['unit_price'], q=4, labels=[0, 1, 2, 3], duplicates='drop')
        
        # Target: has discount (1) or not (0)
        df['has_discount'] = ((df['unit_price'] < df['unit_price'].quantile(0.75)) & 
                             (df['unit_price'] > 0)).astype(int)
        
        # Select features
        feature_cols = ['day_of_week', 'day_of_month', 'month', 'week_of_year', 
                       'is_weekend', 'is_month_start', 'is_month_end']
        
        if 'price_category' in df.columns:
            feature_cols.append('price_category')
        
        X = df[feature_cols].fillna(0)
        y = df['has_discount']
        
        # Train Random Forest
        self.discount_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.discount_model.fit(X, y)
        
        print("✓ Discount prediction model trained")
    
    def predict_price(self, product_name: str, days: int = 30) -> pd.DataFrame:
        """
        Predict future prices for a product
        
        Args:
            product_name: Product identifier
            days: Number of days to forecast
            
        Returns:
            DataFrame with date and predicted_price columns
        """
        if product_name not in self.price_models:
            raise ValueError(f"No price model found for product: {product_name}")
        
        model = self.price_models[product_name]
        
        # Generate forecast
        forecast = model.forecast(steps=days)
        
        # Create result DataFrame
        last_date = model.data.dates[-1]
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=days, freq='D')
        
        result = pd.DataFrame({
            'date': future_dates,
            'predicted_price': forecast.values.clip(min=0)  # Ensure non-negative prices
        })
        
        return result
    
    def predict_discount_probability(self, future_dates: pd.DatetimeIndex) -> np.ndarray:
        """
        Predict probability of discount for future dates
        
        Args:
            future_dates: Dates to predict for
            
        Returns:
            Array of discount probabilities
        """
        if self.discount_model is None:
            raise ValueError("Discount model not trained")
        
        # Create features for future dates
        df = pd.DataFrame({'date': future_dates})
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['week_of_year'] = df['date'].dt.isocalendar().week
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = (df['day_of_month'] <= 7).astype(int)
        df['is_month_end'] = (df['day_of_month'] >= 24).astype(int)
        df['price_category'] = 1  # Default middle category
        
        feature_cols = ['day_of_week', 'day_of_month', 'month', 'week_of_year',
                       'is_weekend', 'is_month_start', 'is_month_end', 'price_category']
        
        X = df[feature_cols]
        
        # Predict probabilities
        probabilities = self.discount_model.predict(X)
        return np.clip(probabilities, 0, 1)  # Ensure between 0 and 1
    
    def predict_next_deal(self, product_name: str, days: int = 60, 
                         current_price: Optional[float] = None) -> Dict:
        """
        Predict when the next deal is likely to occur
        
        Args:
            product_name: Product identifier
            days: Forecast horizon
            current_price: Current product price
            
        Returns:
            Dictionary with next deal prediction
        """
        # Get price forecast
        try:
            price_forecast = self.predict_price(product_name, days=days)
        except ValueError:
            # If no price model, use simple heuristic
            return self._simple_deal_prediction(days, current_price)
        
        # Get discount probabilities
        discount_probs = self.predict_discount_probability(price_forecast['date'])
        
        price_forecast['discount_probability'] = discount_probs
        
        # Find most likely deal date (high discount prob + low price)
        price_forecast['deal_score'] = (
            discount_probs * (1 - (price_forecast['predicted_price'] / price_forecast['predicted_price'].max()))
        )
        
        best_deal_idx = price_forecast['deal_score'].idxmax()
        best_deal = price_forecast.iloc[best_deal_idx]
        
        # Calculate expected discount
        if current_price:
            expected_discount = max(0, (current_price - best_deal['predicted_price']) / current_price * 100)
        else:
            expected_discount = 15  # Default estimate
        
        return {
            'expected_date': best_deal['date'].strftime('%Y-%m-%d'),
            'expected_price': round(float(best_deal['predicted_price']), 2),
            'expected_discount': round(expected_discount, 1),
            'confidence': round(float(best_deal['discount_probability']), 2),
            'days_until_deal': (best_deal['date'] - pd.Timestamp.now()).days
        }
    
    def _simple_deal_prediction(self, days: int, current_price: Optional[float]) -> Dict:
        """Simple heuristic-based deal prediction when no model available"""
        # Assume deals happen around month start/end
        today = pd.Timestamp.now()
        future_dates = pd.date_range(start=today, periods=days, freq='D')
        
        # Find next month start or end
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
        """
        Analyze price trend for a product
        
        Args:
            df: Historical price data
            product_name: Product identifier
            
        Returns:
            Dictionary with trend analysis
        """
        product_df = df[df['product_name'] == product_name].copy()
        
        if len(product_df) < 2:
            return {'trend': 'unknown', 'change': 0}
        
        # Calculate trend using linear regression
        product_df['days'] = (product_df['date'] - product_df['date'].min()).dt.days
        
        X = product_df[['days']].values
        y = product_df['unit_price'].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        slope = model.coef_[0]
        
        # Calculate percentage change
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
        """Save trained models to disk"""
        model_data = {
            'price_models': self.price_models,
            'discount_model': self.discount_model,
            'trend_model': self.trend_model
        }
        joblib.dump(model_data, filepath)
        print(f"✓ Price models saved to {filepath}")
    
    def load_models(self, filepath: str) -> None:
        """Load trained models from disk"""
        model_data = joblib.load(filepath)
        self.price_models = model_data.get('price_models', {})
        self.discount_model = model_data.get('discount_model')
        self.trend_model = model_data.get('trend_model')
        print(f"✓ Price models loaded from {filepath}")


if __name__ == "__main__":
    print("=" * 50)
    print("Price Forecasting Model - Example Usage")
    print("=" * 50)
    
    # Create sample price data
    dates = pd.date_range(start='2025-01-01', end='2026-01-25', freq='D')
    np.random.seed(42)
    
    sample_data = pd.DataFrame({
        'date': dates,
        'product_name': 'Organic Milk 1L',
        'unit_price': 45 + np.random.randn(len(dates)) * 5 + np.sin(np.arange(len(dates)) * 2 * np.pi / 30) * 3
    })
    
    # Train models
    forecaster = PriceForecaster()
    forecaster.train_price_model(sample_data, 'Organic Milk 1L')
    forecaster.train_discount_predictor(sample_data)
    
    # Make predictions
    price_forecast = forecaster.predict_price('Organic Milk 1L', days=14)
    print("\n14-Day Price Forecast:")
    print(price_forecast.head())
    
    # Predict next deal
    next_deal = forecaster.predict_next_deal('Organic Milk 1L', current_price=45.0)
    print("\nNext Deal Prediction:")
    print(next_deal)
    
    print("\n✓ Price forecasting model ready!")
