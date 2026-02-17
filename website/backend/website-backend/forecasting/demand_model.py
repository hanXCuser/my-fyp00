"""
Demand Forecasting Model using Facebook Prophet
Predicts future product demand based on historical sales data
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import joblib
from typing import Dict, List, Optional
import warnings
warnings.filterwarnings('ignore')


class DemandForecaster:
    def predict(self, days=30, product_name=None, category=None):
        """
        Generate demand forecast for a single product or category.
        Returns a DataFrame with date and demand columns.
        """
        import pandas as pd
        if product_name:
            model = self.product_models.get(product_name)
            if not model:
                raise ValueError(f"No model found for product: {product_name}")
            future = model.make_future_dataframe(periods=days)
            forecast = model.predict(future)
            result = pd.DataFrame({
                'date': forecast['ds'][-days:].dt.strftime('%Y-%m-%d'),
                'demand': forecast['yhat'][-days:]
            })
            return result
        elif category:
            # Aggregate forecasts for all products in the category
            # (Assumes product_name encodes category info, or extend as needed)
            forecasts = []
            for pname, model in self.product_models.items():
                if category.lower() in pname.lower():
                    future = model.make_future_dataframe(periods=days)
                    forecast = model.predict(future)
                    forecasts.append(forecast['yhat'][-days:].values)
            if not forecasts:
                raise ValueError(f"No products found for category: {category}")
            total_demand = np.sum(forecasts, axis=0)
            dates = model.make_future_dataframe(periods=days)['ds'][-days:].dt.strftime('%Y-%m-%d')
            result = pd.DataFrame({
                'date': dates,
                'demand': total_demand
            })
            return result
        else:
            raise ValueError("Must provide product_name or category for single forecast. Use predict_all_products for all.")
    def save_model(self, path: str):
        """Save the demand forecaster object to a pickle file."""
        import joblib
        joblib.dump(self, path)
        return path

    def get_high_demand_alerts(self, days=7, threshold=1.5):
        """
        Identify products with a predicted demand spike in the next N days.
        Returns a list of alerts with product_name, peak_demand, peak_date, and alert_level.
        """
        alerts = []
        for product_name, model in self.product_models.items():
            future = model.make_future_dataframe(periods=days)
            forecast = model.predict(future)
            yhat = forecast['yhat'][-days:]
            peak_demand = yhat.max()
            peak_idx = yhat.idxmax()
            peak_date = forecast.loc[peak_idx, 'ds']
            # Simple alert logic: compare peak to mean of previous period
            past_mean = forecast['yhat'][:-days].mean() if len(forecast['yhat']) > days else 0
            if past_mean > 0 and peak_demand >= threshold * past_mean:
                alert_level = 'high'
            elif past_mean > 0 and peak_demand >= 1.2 * past_mean:
                alert_level = 'medium'
            else:
                alert_level = 'low'
            alerts.append({
                'product_name': product_name,
                'peak_demand': int(peak_demand),
                'peak_date': str(peak_date)[:10],
                'alert_level': alert_level
            })
        # Sort by alert level and peak demand
        alerts = sorted(alerts, key=lambda x: (x['alert_level'], -x['peak_demand']), reverse=True)
        return alerts

    def __init__(self):
        self.model = None
        self.product_models = {}

    def load_model(self, path: str):
        """Load a pickled demand forecaster object from file."""
        loaded = joblib.load(path)
        self.model = loaded.model if hasattr(loaded, 'model') else None
        self.product_models = loaded.product_models if hasattr(loaded, 'product_models') else {}
        # Optionally, copy other attributes if needed
        return self

    def predict_all_products(self, days=30, top_n=10):
        """
        Generate demand forecasts for all products.
        Returns a list of dicts with product_name, trend, growth_rate, avg_daily_demand, and forecast.
        """
        results = []
        for product_name, model in self.product_models.items():
            # Predict future demand
            future = model.make_future_dataframe(periods=days)
            forecast = model.predict(future)
            # Calculate trend and stats
            yhat = forecast['yhat'][-days:]
            avg_daily_demand = max(int(yhat.mean()), 0)
            growth_rate = (yhat.iloc[-1] - yhat.iloc[0]) / max(abs(yhat.iloc[0]), 1e-6)
            trend = 'increasing' if growth_rate > 0 else 'decreasing' if growth_rate < 0 else 'stable'
            results.append({
                'product_name': product_name,
                'trend': trend,
                'growth_rate': float(growth_rate),
                'avg_daily_demand': avg_daily_demand,
                'forecast': yhat.tolist()
            })
        # Sort by avg_daily_demand and return top_n
        results = sorted(results, key=lambda x: x['avg_daily_demand'], reverse=True)[:top_n]
        return results
# ...existing code...
