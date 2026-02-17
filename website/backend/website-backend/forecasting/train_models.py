from prophet import Prophet
"""
Model Training Script
Downloads Kaggle dataset and trains all forecasting models
"""

import argparse
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import os

# Add current directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))
os.chdir(str(current_dir))

# Import with hyphens replaced by underscores
import importlib.util


# Standard imports for local modules
from demand_model import DemandForecaster
try:
    from price_model import PriceForecaster
except ImportError:
    PriceForecaster = None

from data_processor import RetailDataProcessor


def parse_args():
    parser = argparse.ArgumentParser(description="Train forecasting models")
    parser.add_argument(
        "--sales-file",
        type=str,
        default=None,
        help="Path to sales CSV file (defaults to data/retail_sales.csv)",
    )
    parser.add_argument(
        "--freq",
        type=str,
        default="D",
        choices=["D", "W", "M"],
        help="Aggregation frequency: D=day, W=week, M=month",
    )
    return parser.parse_args()


def resolve_sales_file(data_dir: Path, sales_file_arg: str) -> Path:
    if sales_file_arg:
        return Path(sales_file_arg)

    default_file = data_dir / "retail_sales.csv"
    if default_file.exists():
        return default_file

    inventory_file = data_dir / "retail_store_inventory.csv"
    if inventory_file.exists():
        print("ℹ️  Using retail_store_inventory.csv as the sales file")
        return inventory_file

    return default_file


def main():
    print("=" * 60)
    print("FORECASTING MODEL TRAINING PIPELINE")
    print("=" * 60)

    args = parse_args()
    
    # Paths
    data_dir = Path(__file__).parent / 'data'
    models_dir = Path(__file__).parent / 'models'
    models_dir.mkdir(exist_ok=True)
    
    # Step 1: Check for dataset
    print("\n[1/5] Checking for dataset...")
    sales_file = resolve_sales_file(data_dir, args.sales_file)
    
    if not sales_file.exists():
        print("\n⚠️  Dataset not found!")
        print("\nTo get the dataset:")
        print("1. Go to Kaggle: https://www.kaggle.com/datasets")
        print("2. Download one of these datasets:")
        print("   - 'Supermarket Sales' by aungpyaeap")
        print("   - 'Retail Sales Dataset' by mohammadtalib786")
        print("   - 'Online Retail' by tunguz")
        print("3. Save as: backend/forecasting/data/retail_sales.csv")
        print("\nOr use the sample dataset generator below...")
        
        # Generate sample dataset
        generate_sample = input("\nGenerate sample dataset for testing? (y/n): ")
        if generate_sample.lower() == 'y':
            generate_sample_dataset(sales_file)
        else:
            return
    
    # Step 2: Load and process data
    print("\n[2/5] Loading and processing data...")
    processor = RetailDataProcessor(str(sales_file))
    
    try:
        sales_df, _ = processor.load_data()
        sales_df = processor.clean_sales_data(sales_df)
        agg_df = processor.create_period_aggregates(sales_df, freq=args.freq)
        agg_df = processor.add_time_features(agg_df)

        print(f"✓ Processed {len(agg_df)} aggregated records")
        print(f"  Date range: {agg_df['date'].min()} to {agg_df['date'].max()}")

        if 'product_name' in agg_df.columns:
            print(f"  Products: {agg_df['product_name'].nunique()}")
        if 'category' in agg_df.columns:
            print(f"  Categories: {agg_df['category'].nunique()}")
            
    except Exception as e:
        print(f"❌ Error processing data: {e}")
        return
    
    # Step 3: Train demand forecasting model
    print("\n[3/5] Training demand forecasting model...")
    
    try:
        demand_forecaster = DemandForecaster()
        
        # Prepare data for Prophet
        if 'quantity' in agg_df.columns:
            # Fix: For product models, train each product separately to avoid duplicate dates
            if 'product_name' in agg_df.columns:
                product_names = agg_df['product_name'].unique()
                for product in product_names:
                    product_data = agg_df[agg_df['product_name'] == product][['date', 'quantity']].copy()
                    # Ensure date is only date (no time)
                    product_data['date'] = pd.to_datetime(product_data['date']).dt.date
                    product_data = product_data.groupby('date')['quantity'].sum().reset_index()
                    product_data.columns = ['ds', 'y']
                    # Final clean: drop NaNs, ensure date type, reset index
                    product_data = product_data.dropna(subset=['ds', 'y'])
                    product_data['ds'] = pd.to_datetime(product_data['ds'])
                    product_data = product_data.reset_index(drop=True)
                    # Print diagnostics
                    print(f"\n--- Product: {product} ---")
                    print(product_data.head(5))
                    print(product_data.tail(5))
                    print(f"Rows: {len(product_data)}, Unique dates: {product_data['ds'].nunique()}")
                    # Debug: Check for duplicate dates
                    dupes = product_data['ds'][product_data['ds'].duplicated()]
                    if not dupes.empty:
                        print(f"❌ Duplicate dates found for product '{product}': {dupes.tolist()}")
                        continue
                    # Prophet expects at least 10 data points
                    if len(product_data) >= 10:
                        demand_forecaster.product_models[product] = Prophet(
                            yearly_seasonality=True,
                            weekly_seasonality=True,
                            daily_seasonality=False,
                            seasonality_mode='multiplicative',
                            changepoint_prior_scale=0.05
                        )
                        demand_forecaster.product_models[product].fit(product_data)
                print(f"✓ Trained {len(demand_forecaster.product_models)} product models")
                # Save model
                demand_model_path = models_dir / 'demand_forecaster.pkl'
                demand_forecaster.save_model(str(demand_model_path))
                print(f"✓ Demand model saved to {demand_model_path}")
            else:
                prophet_df = agg_df[['date', 'quantity']].copy()
                # Ensure date is only date (no time)
                prophet_df['date'] = pd.to_datetime(prophet_df['date']).dt.date
                prophet_df = prophet_df.groupby('date')['quantity'].sum().reset_index()
                prophet_df.columns = ['ds', 'y']
                # Final clean: drop NaNs, ensure date type, reset index
                prophet_df = prophet_df.dropna(subset=['ds', 'y'])
                prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])
                prophet_df = prophet_df.reset_index(drop=True)
                # Print diagnostics
                print("\n--- Overall Model Data ---")
                print(prophet_df.head(5))
                print(prophet_df.tail(5))
                print(f"Rows: {len(prophet_df)}, Unique dates: {prophet_df['ds'].nunique()}")
                # Debug: Check for duplicate dates
                dupes = prophet_df['ds'][prophet_df['ds'].duplicated()]
                if not dupes.empty:
                    print(f"❌ Duplicate dates found in overall model: {dupes.tolist()}")
                else:
                    demand_forecaster.train(prophet_df, granularity='overall')
                    # Save model
                    demand_model_path = models_dir / 'demand_forecaster.pkl'
                    demand_forecaster.save_model(str(demand_model_path))
                    print(f"✓ Demand model saved to {demand_model_path}")
            
            # Save model
            demand_model_path = models_dir / 'demand_forecaster.pkl'
            demand_forecaster.save_model(str(demand_model_path))
            
            print(f"✓ Demand model saved to {demand_model_path}")
        else:
            print("⚠️  No quantity data found, skipping demand model")
            
    except Exception as e:
        print(f"❌ Error training demand model: {e}")
    
    # Step 4: Train price forecasting model
    print("\n[4/5] Training price forecasting model...")
    
    try:
        price_forecaster = PriceForecaster()
        
        if 'unit_price' in agg_df.columns:
            # Train discount predictor
            price_forecaster.train_discount_predictor(agg_df)
            
            # Train price models for top products
            if 'product_name' in agg_df.columns:
                top_products = agg_df['product_name'].value_counts().head(10).index
                
                for product in top_products:
                    product_df = agg_df[agg_df['product_name'] == product].copy()
                    price_forecaster.train_price_model(product_df, product)
                    
                print(f"✓ Trained price models for {len(price_forecaster.price_models)} products")
            
            # Save models
            price_model_path = models_dir / 'price_forecaster.pkl'
            price_forecaster.save_models(str(price_model_path))
            
            print(f"✓ Price models saved to {price_model_path}")
        else:
            print("⚠️  No price data found, skipping price model")
            
    except Exception as e:
        print(f"❌ Error training price model: {e}")
    
    # Step 5: Generate sample predictions
    print("\n[5/5] Testing models with sample predictions...")
    
    try:
        # Test demand forecast
        if demand_forecaster.model or demand_forecaster.product_models:
            forecast = demand_forecaster.predict(days=7)
            print("\n7-Day Demand Forecast (sample):")
            print(forecast.head(3))
        
        # Test price forecast
        if price_forecaster.price_models:
            product_name = list(price_forecaster.price_models.keys())[0]
            price_forecast = price_forecaster.predict_price(product_name, days=7)
            print(f"\n7-Day Price Forecast for {product_name}:")
            print(price_forecast.head(3))
            
    except Exception as e:
        print(f"⚠️  Could not generate sample predictions: {e}")
    
    print("\n" + "=" * 60)
    print("✅ TRAINING COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Models are saved in: backend/forecasting/models/")
    print("2. Test the API endpoints: backend/api/forecasting/")
    print("3. Integrate with frontend UI")


def generate_sample_dataset(output_path: Path):
    """Generate a sample retail dataset for testing"""
    print("\nGenerating sample dataset...")
    
    np.random.seed(42)
    
    # Products
    products = [
        ('Organic Milk 1L', 'Dairy', 45.0),
        ('Whole Wheat Bread', 'Bakery', 25.0),
        ('Fresh Chicken Breast', 'Meat', 120.0),
        ('Organic Bananas', 'Fruits', 15.0),
        ('Premium Coffee Beans', 'Beverages', 180.0),
        ('Greek Yogurt', 'Dairy', 35.0),
        ('Brown Rice 1kg', 'Grains', 55.0),
        ('Free Range Eggs', 'Dairy', 40.0),
        ('Fresh Tomatoes', 'Vegetables', 30.0),
        ('Olive Oil 500ml', 'Condiments', 95.0)
    ]
    
    # Generate 1 year of data
    dates = pd.date_range(start='2025-01-01', end='2026-01-25', freq='D')
    
    data = []
    
    for date in dates:
        # 5-15 transactions per day
        n_transactions = np.random.randint(5, 15)
        
        for _ in range(n_transactions):
            product, category, base_price = products[np.random.randint(0, len(products))]
            
            # Add seasonality and randomness to price
            day_of_year = date.timetuple().tm_yday
            seasonal_factor = 1 + 0.1 * np.sin(2 * np.pi * day_of_year / 365)
            price = base_price * seasonal_factor * np.random.uniform(0.9, 1.1)
            
            # Occasional discounts
            if np.random.random() < 0.2:  # 20% chance of discount
                price *= np.random.uniform(0.75, 0.95)
            
            # Quantity sold
            quantity = np.random.randint(1, 10)
            
            data.append({
                'date': date,
                'product_name': product,
                'category': category,
                'unit_price': round(price, 2),
                'quantity': quantity,
                'total_sales': round(price * quantity, 2)
            })
    
    # Create DataFrame and save
    df = pd.DataFrame(data)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    
    print(f"✓ Generated sample dataset with {len(df)} records")
    print(f"  Saved to: {output_path}")


if __name__ == "__main__":
    main()
