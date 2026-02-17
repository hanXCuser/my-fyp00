"""
Data Processor for Kaggle Retail Datasets
Handles data cleaning, preprocessing, and feature engineering for forecasting models
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')


class RetailDataProcessor:
    """Process and prepare retail sales data for forecasting models"""
    
    def __init__(self, sales_file: str, products_file: Optional[str] = None):
        """
        Initialize data processor
        
        Args:
            sales_file: Path to sales CSV file
            products_file: Path to products CSV file (optional)
        """
        self.sales_file = sales_file
        self.products_file = products_file
        self.sales_df = None
        self.products_df = None
        
    def load_data(self) -> Tuple[pd.DataFrame, Optional[pd.DataFrame]]:
        """Load raw data from CSV files"""
        print("Loading sales data...")
        self.sales_df = pd.read_csv(self.sales_file)
        
        if self.products_file:
            print("Loading products data...")
            self.products_df = pd.read_csv(self.products_file)
            
        return self.sales_df, self.products_df
    
    def clean_sales_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and standardize sales data
        
        Expected columns (flexible):
        - Date/date/invoice_date/transaction_date
        - Product/product_name/item/product_line
        - Quantity/qty/quantity_sold/unit_sales
        - Price/unit_price/price
        - Total/total_amount/sales
        - Category/product_category (optional)
        """
        df = df.copy()
        
        # Standardize column names
        column_mapping = {
                'unit_cost': 'unit_price',
            # Date columns
            'Date': 'date', 'invoice_date': 'date', 'transaction_date': 'date',
            'Invoice Date': 'date', 'Transaction Date': 'date',
            
            # Product columns
            'Product': 'product_name', 'Item': 'product_name', 
            'Product line': 'product_name', 'product_line': 'product_name',
            'Product ID': 'product_name',
            
            # Quantity columns
            'Quantity': 'quantity', 'qty': 'quantity', 'Qty': 'quantity',
            'quantity_sold': 'quantity', 'unit_sales': 'quantity',
            'Units Sold': 'quantity',
            
            # Price columns
            'Price': 'unit_price', 'Unit price': 'unit_price',
            'Unit Price': 'unit_price', 'price': 'unit_price',
            
            # Total columns
            'Total': 'total_sales', 'total_amount': 'total_sales',
            'Sales': 'total_sales', 'gross income': 'total_sales',
            
            # Category columns
            'Category': 'category', 'product_category': 'category',
            'Product Category': 'category'
        }
        
        df.rename(columns=column_mapping, inplace=True)
        
        # Convert date to datetime OR generate dates if missing
        date_col = next((col for col in df.columns if 'date' in col.lower()), None)
        if date_col:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            if date_col != 'date':
                df.rename(columns={date_col: 'date'}, inplace=True)
        else:
            # Generate realistic dates spanning 3 months (January - March 2026)
            print("⚠️  No date column found - generating synthetic dates...")
            n_rows = len(df)
            start_date = datetime(2026, 1, 1)
            # Distribute sales across 90 days
            date_indices = np.random.choice(range(90), size=n_rows, replace=True)
            df['date'] = [start_date + timedelta(days=int(d)) for d in date_indices]
            df.sort_values('date', inplace=True)
            print(f"✓ Generated dates from {df['date'].min()} to {df['date'].max()}")
        
        # Remove rows with missing critical data
        critical_cols = []
        if 'product_name' in df.columns:
            critical_cols.append('product_name')
        if 'quantity' in df.columns:
            critical_cols.append('quantity')
            
        df.dropna(subset=critical_cols, inplace=True)
        
        # Remove duplicates
        df.drop_duplicates(inplace=True)
        
        # Sort by date
        df.sort_values('date', inplace=True)
        df.reset_index(drop=True, inplace=True)
        
        print(f"✓ Cleaned data: {len(df)} rows, {len(df.columns)} columns")
        return df
    
    def create_daily_aggregates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Aggregate sales data by day and product"""
        return self.create_period_aggregates(df, freq='D')

    def create_period_aggregates(self, df: pd.DataFrame, freq: str = 'D') -> pd.DataFrame:
        """Aggregate sales data by period (D=day, W=week, M=month) and product"""
        agg_dict = {}
        
        if 'quantity' in df.columns:
            agg_dict['quantity'] = 'sum'
        if 'total_sales' in df.columns:
            agg_dict['total_sales'] = 'sum'
        if 'unit_price' in df.columns:
            agg_dict['unit_price'] = 'mean'
            
        group_cols = [pd.Grouper(key='date', freq=freq)]
        if 'product_name' in df.columns:
            group_cols.append('product_name')
        if 'category' in df.columns:
            group_cols.append('category')

        period_df = df.groupby(group_cols).agg(agg_dict).reset_index()

        freq_label = {'D': 'daily', 'W': 'weekly', 'M': 'monthly'}.get(freq, freq)
        print(f"✓ Created {freq_label} aggregates: {len(period_df)} rows")
        return period_df
    
    def add_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add time-based features for ML models"""
        df = df.copy()
        
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['day_of_week'] = df['date'].dt.dayofweek
        df['week_of_year'] = df['date'].dt.isocalendar().week
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = df['date'].dt.is_month_start.astype(int)
        df['is_month_end'] = df['date'].dt.is_month_end.astype(int)
        
        # Seasonal indicators
        df['season'] = df['month'].apply(self._get_season)
        
        print("✓ Added time-based features")
        return df
    
    @staticmethod
    def _get_season(month: int) -> str:
        """Get season from month (Southern Hemisphere - Mauritius)"""
        if month in [12, 1, 2]:
            return 'summer'
        elif month in [3, 4, 5]:
            return 'autumn'
        elif month in [6, 7, 8]:
            return 'winter'
        else:
            return 'spring'
    
    def prepare_for_prophet(self, df: pd.DataFrame, target_col: str = 'quantity') -> pd.DataFrame:
        """
        Prepare data for Facebook Prophet model
        
        Args:
            df: DataFrame with date and target columns
            target_col: Column to forecast (default: 'quantity')
            
        Returns:
            DataFrame with 'ds' (date) and 'y' (target) columns
        """
        prophet_df = df[['date', target_col]].copy()
        prophet_df.columns = ['ds', 'y']
        prophet_df = prophet_df.groupby('ds')['y'].sum().reset_index()
        
        print(f"✓ Prepared data for Prophet: {len(prophet_df)} rows")
        return prophet_df
    
    def prepare_for_sklearn(self, df: pd.DataFrame, target_col: str = 'quantity') -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare data for scikit-learn models
        
        Args:
            df: DataFrame with features
            target_col: Target column name
            
        Returns:
            Tuple of (features_df, target_series)
        """
        # Add time features if not present
        if 'year' not in df.columns:
            df = self.add_time_features(df)
        
        # Select numeric features
        feature_cols = ['year', 'month', 'day', 'day_of_week', 'week_of_year', 
                       'is_weekend', 'is_month_start', 'is_month_end']
        
        # Add category encoding if present
        if 'category' in df.columns:
            df['category_encoded'] = pd.factorize(df['category'])[0]
            feature_cols.append('category_encoded')
            
        if 'product_name' in df.columns:
            df['product_encoded'] = pd.factorize(df['product_name'])[0]
            feature_cols.append('product_encoded')
        
        X = df[feature_cols]
        y = df[target_col]
        
        print(f"✓ Prepared data for sklearn: {len(X)} samples, {len(feature_cols)} features")
        return X, y
    
    def split_train_test(self, df: pd.DataFrame, test_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Split data into train and test sets (time-based split)
        
        Args:
            df: DataFrame sorted by date
            test_size: Proportion of data for testing
            
        Returns:
            Tuple of (train_df, test_df)
        """
        split_idx = int(len(df) * (1 - test_size))
        train_df = df.iloc[:split_idx].copy()
        test_df = df.iloc[split_idx:].copy()
        
        print(f"✓ Split data: {len(train_df)} train, {len(test_df)} test")
        return train_df, test_df
    
    def get_product_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """Get statistical summary by product"""
        if 'product_name' not in df.columns or 'quantity' not in df.columns:
            return pd.DataFrame()
            
        stats = df.groupby('product_name').agg({
            'quantity': ['sum', 'mean', 'std', 'min', 'max'],
            'date': ['min', 'max', 'count']
        }).round(2)
        
        stats.columns = ['total_quantity', 'avg_daily_quantity', 'std_quantity', 
                        'min_quantity', 'max_quantity', 'first_sale', 'last_sale', 'num_days']
        
        return stats.reset_index()


def process_kaggle_supermarket_sales(file_path: str) -> pd.DataFrame:
    """
    Process standard Kaggle Supermarket Sales dataset
    Expected columns: Invoice ID, Branch, City, Customer type, Gender, 
                     Product line, Unit price, Quantity, Tax 5%, Total, 
                     Date, Time, Payment, cogs, gross margin percentage, 
                     gross income, Rating
    """
    df = pd.read_csv(file_path)
    
    # Standardize column names
    df.rename(columns={
        'Product line': 'product_name',
        'Quantity': 'quantity',
        'Unit price': 'unit_price',
        'Total': 'total_sales',
        'Date': 'date',
        'Branch': 'branch',
        'City': 'city'
    }, inplace=True)
    
    # Convert date
    df['date'] = pd.to_datetime(df['date'])
    
    # Add category (use product line as category)
    df['category'] = df['product_name']
    
    return df


if __name__ == "__main__":
    # Example usage
    print("=" * 50)
    print("Retail Data Processor - Example Usage")
    print("=" * 50)
    
    # Initialize processor
    processor = RetailDataProcessor(
        sales_file='data/retail_sales.csv'
    )
    
    # Load and process data
    try:
        sales_df, _ = processor.load_data()
        sales_df = processor.clean_sales_data(sales_df)
        daily_df = processor.create_daily_aggregates(sales_df)
        daily_df = processor.add_time_features(daily_df)
        
        # Show stats
        print("\n" + "=" * 50)
        print("Dataset Summary:")
        print(f"Date range: {daily_df['date'].min()} to {daily_df['date'].max()}")
        print(f"Total products: {daily_df['product_name'].nunique() if 'product_name' in daily_df.columns else 'N/A'}")
        print(f"Total rows: {len(daily_df)}")
        
    except FileNotFoundError:
        print("\n⚠️  Dataset not found. Please:")
        print("1. Download a Kaggle retail dataset")
        print("2. Place it in backend/forecasting/data/")
        print("3. Update the file path in this script")
