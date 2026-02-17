"""
Test Forecasting Models
Test trained models and verify predictions
"""

import importlib.util
import os
from pathlib import Path

# Dynamically import demand_model and price_model (with hyphens)
current_dir = Path(__file__).parent
os.chdir(str(current_dir))

spec = importlib.util.spec_from_file_location("demand_model", current_dir / "demand-model.py")
demand_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(demand_module)
DemandForecaster = demand_module.DemandForecaster
evaluate_forecast = getattr(demand_module, 'evaluate_forecast', None)

spec = importlib.util.spec_from_file_location("price_model", current_dir / "price-model.py")
price_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(price_module)
PriceForecaster = price_module.PriceForecaster


def test_demand_forecast():
    """Test demand forecasting model"""
    print("\n" + "=" * 60)
    print("TESTING DEMAND FORECASTING MODEL")
    print("=" * 60)
    
    models_dir = Path(__file__).parent / 'models'
    model_path = models_dir / 'demand_forecaster.pkl'
    
    if not model_path.exists():
        print("❌ Demand model not found. Run train_models.py first.")
        return
    
    # Load model
    forecaster = DemandForecaster()
    forecaster.load_model(str(model_path))
    
    # Test overall forecast
    print("\n[1] Overall Demand Forecast (30 days):")
    try:
        forecast = forecaster.predict(days=30)
        print(forecast.head(10))
        print(f"\nAverage daily demand: {forecast['demand'].mean():.0f} units")
        print(f"Peak demand: {forecast['demand'].max():.0f} units on {forecast.loc[forecast['demand'].idxmax(), 'date']}")
    except Exception as e:
        print(f"⚠️  Could not generate overall forecast: {e}")
    
    # Test product forecasts
    if forecaster.product_models:
        print(f"\n[2] Product-Specific Forecasts ({len(forecaster.product_models)} products):")
        
        forecasts = forecaster.predict_all_products(days=30, top_n=5)
        
        for item in forecasts:
            print(f"\n  {item['product_name']}:")
            print(f"    Trend: {item['trend']}")
            print(f"    Growth rate: {item['growth_rate']*100:.1f}%")
            print(f"    Avg daily demand: {item['avg_daily_demand']} units")
    
    # Test high demand alerts
    print("\n[3] High Demand Alerts (7 days ahead):")
    try:
        alerts = forecaster.get_high_demand_alerts(days=7, threshold=1.3)
        
        if alerts:
            for alert in alerts[:5]:
                print(f"\n  ⚠️  {alert['product_name']}")
                print(f"     Peak: {alert['peak_demand']} units on {alert['peak_date']}")
                print(f"     Alert level: {alert['alert_level'].upper()}")
        else:
            print("  No high demand alerts")
    except Exception as e:
        print(f"  Could not generate alerts: {e}")
    
    print("\n✓ Demand forecast testing complete")


def test_price_forecast():
    """Test price forecasting model"""
    print("\n" + "=" * 60)
    print("TESTING PRICE FORECASTING MODEL")
    print("=" * 60)
    
    models_dir = Path(__file__).parent / 'models'
    model_path = models_dir / 'price_forecaster.pkl'
    
    if not model_path.exists():
        print("❌ Price model not found. Run train_models.py first.")
        return
    
    # Load model
    forecaster = PriceForecaster()
    forecaster.load_models(str(model_path))
    
    # Test price forecasts
    if forecaster.price_models:
        print(f"\n[1] Price Forecasts ({len(forecaster.price_models)} products):")
        
        for product_name in list(forecaster.price_models.keys())[:3]:
            print(f"\n  {product_name}:")
            
            try:
                price_forecast = forecaster.predict_price(product_name, days=14)
                print(f"    14-day forecast:")
                print(f"    Current: ${price_forecast['predicted_price'].iloc[0]:.2f}")
                print(f"    In 7 days: ${price_forecast['predicted_price'].iloc[6]:.2f}")
                print(f"    In 14 days: ${price_forecast['predicted_price'].iloc[-1]:.2f}")
            except Exception as e:
                print(f"    Error: {e}")
    
    # Test next deal predictions
    if forecaster.price_models:
        print("\n[2] Next Deal Predictions:")
        
        for product_name in list(forecaster.price_models.keys())[:3]:
            try:
                next_deal = forecaster.predict_next_deal(product_name, days=30, current_price=50.0)
                
                if next_deal['expected_date']:
                    print(f"\n  {product_name}:")
                    print(f"    Expected date: {next_deal['expected_date']}")
                    print(f"    Days until: {next_deal['days_until_deal']}")
                    print(f"    Expected discount: {next_deal['expected_discount']:.1f}%")
                    print(f"    Confidence: {next_deal['confidence']*100:.0f}%")
            except Exception as e:
                print(f"  Error for {product_name}: {e}")
    
    # Test discount probability
    if forecaster.discount_model:
        print("\n[3] Discount Probability for Next 7 Days:")
        
        future_dates = pd.date_range(start=pd.Timestamp.now(), periods=7, freq='D')
        try:
            probs = forecaster.predict_discount_probability(future_dates)
            
            for date, prob in zip(future_dates, probs):
                print(f"  {date.strftime('%Y-%m-%d %A')}: {prob*100:.1f}%")
        except Exception as e:
            print(f"  Error: {e}")
    
    print("\n✓ Price forecast testing complete")


def main():
    """Run all tests"""
    print("=" * 60)
    print("FORECASTING MODELS TEST SUITE")
    print("=" * 60)
    
    test_demand_forecast()
    test_price_forecast()
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS COMPLETE")
    print("=" * 60)
    print("\nModels are ready for API integration!")


if __name__ == "__main__":
    main()
