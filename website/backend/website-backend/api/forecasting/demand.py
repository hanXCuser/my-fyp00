"""
Demand Forecasting API Endpoint
GET /api/forecasting/demand
"""

from flask import Flask, request, jsonify
from pathlib import Path
import sys

# Add forecasting module to path
forecasting_dir = Path(__file__).parent.parent.parent / 'forecasting'
sys.path.append(str(forecasting_dir))

try:
    from demand_model import DemandForecaster
    
    # Load trained model
    model_path = forecasting_dir / 'models' / 'demand_forecaster.pkl'
    forecaster = DemandForecaster()
    
    if model_path.exists():
        forecaster.load_model(str(model_path))
        MODEL_LOADED = True
    else:
        MODEL_LOADED = False
        print("⚠️  Demand model not found. Run train_models.py first.")
        
except Exception as e:
    MODEL_LOADED = False
    print(f"⚠️  Error loading demand model: {e}")


def handler(request):
    """
    Vercel serverless function handler
    
    Query Parameters:
        product_id (optional): Specific product ID
        category (optional): Product category
        days (optional): Forecast horizon (default: 30)
        top_n (optional): Number of products to forecast (default: 10)
    """
    if request.method == 'OPTIONS':
        return jsonify({}), 200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    
    if request.method != 'GET':
        return jsonify({'success': False, 'error': 'Method not allowed'}), 405
    
    if not MODEL_LOADED:
        return jsonify({
            'success': False,
            'error': 'Forecasting model not available. Please train the model first.',
            'instructions': 'Run: python backend/forecasting/train_models.py'
        }), 503
    
    try:
        # Get query parameters
        product_id = request.args.get('product_id')
        category = request.args.get('category')
        days = int(request.args.get('days', 30))
        top_n = int(request.args.get('top_n', 10))
        
        # Validate parameters
        if days < 1 or days > 365:
            return jsonify({
                'success': False,
                'error': 'Days must be between 1 and 365'
            }), 400
        
        # Generate forecasts
        if product_id:
            # Forecast for specific product
            forecast = forecaster.predict(days=days, product_name=product_id)
            
            result = {
                'success': True,
                'product_id': product_id,
                'forecast_days': days,
                'predictions': forecast.to_dict('records'),
                'summary': {
                    'avg_daily_demand': int(forecast['demand'].mean()),
                    'peak_demand': int(forecast['demand'].max()),
                    'peak_date': forecast.loc[forecast['demand'].idxmax(), 'date']
                }
            }
            
        elif category:
            # Forecast for category
            forecast = forecaster.predict(days=days, category=category)
            
            result = {
                'success': True,
                'category': category,
                'forecast_days': days,
                'predictions': forecast.to_dict('records'),
                'summary': {
                    'avg_daily_demand': int(forecast['demand'].mean()),
                    'total_demand': int(forecast['demand'].sum())
                }
            }
            
        else:
            # Forecast for all products
            forecasts = forecaster.predict_all_products(days=days, top_n=top_n)
            
            # Get high demand alerts
            alerts = forecaster.get_high_demand_alerts(days=min(days, 7), threshold=1.5)
            
            result = {
                'success': True,
                'forecast_days': days,
                'num_products': len(forecasts),
                'forecasts': forecasts,
                'high_demand_alerts': alerts[:5],  # Top 5 alerts
                'summary': {
                    'total_products': len(forecaster.product_models),
                    'forecast_generated_at': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            }
        
        return jsonify(result), 200, {'Access-Control-Allow-Origin': '*'}
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500, {'Access-Control-Allow-Origin': '*'}


# For local testing
if __name__ == '__main__':
    from flask import Flask
    import pandas as pd
    
    app = Flask(__name__)
    
    @app.route('/api/forecasting/demand', methods=['GET', 'OPTIONS'])
    def demand_forecast():
        return handler(request)
    
    app.run(debug=True, port=5001)
