"""
Price Forecasting API Endpoint
GET /api/forecasting/price
"""

from flask import Flask, request, jsonify
from pathlib import Path
import sys
import pandas as pd

# Add forecasting module to path
forecasting_dir = Path(__file__).parent.parent.parent / 'forecasting'
sys.path.append(str(forecasting_dir))

try:
    from price_model import PriceForecaster
    
    # Load trained model
    model_path = forecasting_dir / 'models' / 'price_forecaster.pkl'
    forecaster = PriceForecaster()
    
    if model_path.exists():
        forecaster.load_models(str(model_path))
        MODEL_LOADED = True
    else:
        MODEL_LOADED = False
        print("⚠️  Price model not found. Run train_models.py first.")
        
except Exception as e:
    MODEL_LOADED = False
    print(f"⚠️  Error loading price model: {e}")


def handler(request):
    """
    Vercel serverless function handler
    
    Query Parameters:
        product_id (required): Product ID or name
        days (optional): Forecast horizon (default: 30)
        current_price (optional): Current product price for deal prediction
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
            'error': 'Price forecasting model not available. Please train the model first.',
            'instructions': 'Run: python backend/forecasting/train_models.py'
        }), 503
    
    try:
        # Get query parameters
        product_id = request.args.get('product_id')
        days = int(request.args.get('days', 30))
        current_price = request.args.get('current_price')
        
        if not product_id:
            return jsonify({
                'success': False,
                'error': 'product_id parameter is required'
            }), 400
        
        # Validate parameters
        if days < 1 or days > 365:
            return jsonify({
                'success': False,
                'error': 'Days must be between 1 and 365'
            }), 400
        
        current_price = float(current_price) if current_price else None
        
        # Generate price forecast
        try:
            price_forecast = forecaster.predict_price(product_id, days=days)
            
            # Add discount probabilities
            discount_probs = forecaster.predict_discount_probability(price_forecast['date'])
            price_forecast['discount_probability'] = discount_probs
            
            # Predict next deal
            next_deal = forecaster.predict_next_deal(product_id, days=days, current_price=current_price)
            
            result = {
                'success': True,
                'product_id': product_id,
                'forecast_days': days,
                'current_price': current_price,
                'predictions': price_forecast.to_dict('records'),
                'next_deal_prediction': next_deal,
                'summary': {
                    'avg_predicted_price': round(float(price_forecast['predicted_price'].mean()), 2),
                    'min_predicted_price': round(float(price_forecast['predicted_price'].min()), 2),
                    'max_predicted_price': round(float(price_forecast['predicted_price'].max()), 2),
                    'avg_discount_probability': round(float(discount_probs.mean()), 2)
                }
            }
            
            return jsonify(result), 200, {'Access-Control-Allow-Origin': '*'}
            
        except ValueError as e:
            # Product not found in trained models
            # Return heuristic-based prediction
            next_deal = forecaster._simple_deal_prediction(days, current_price)
            
            return jsonify({
                'success': True,
                'product_id': product_id,
                'forecast_days': days,
                'current_price': current_price,
                'predictions': [],
                'next_deal_prediction': next_deal,
                'note': 'Using heuristic prediction (product not in training data)'
            }), 200, {'Access-Control-Allow-Origin': '*'}
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500, {'Access-Control-Allow-Origin': '*'}


# For local testing
if __name__ == '__main__':
    from flask import Flask
    
    app = Flask(__name__)
    
    @app.route('/api/forecasting/price', methods=['GET', 'OPTIONS'])
    def price_forecast():
        return handler(request)
    
    app.run(debug=True, port=5002)
