# How to Download Kaggle Retail Dataset

## Option 1: Direct Download from Kaggle Website

1. **Go to Kaggle** and sign in (create free account if needed):
   - https://www.kaggle.com

2. **Choose one of these recommended datasets**:

   ### Supermarket Sales (Recommended)
   - URL: https://www.kaggle.com/datasets/aungpyaeap/supermarket-sales
   - Size: ~1MB
   - 1,000 records with product lines, prices, quantities
   - Perfect for forecasting
   
   ### Online Retail Dataset
   - URL: https://www.kaggle.com/datasets/tunguz/online-retail
   - Size: ~20MB
   - 500,000+ transactions
   - More comprehensive but larger

   ### Retail Sales Dataset
   - URL: https://www.kaggle.com/datasets/mohammadtalib786/retail-sales-dataset
   - Size: ~500KB
   - Simple format, easy to use

3. **Download the dataset**:
   - Click "Download" button on the dataset page
   - Extract the ZIP file
   - Find the CSV file (usually named `supermarket_sales.csv` or similar)

4. **Move to project**:
   - Rename the CSV to `retail_sales.csv`
   - Copy to: `website/backend/website-backend/forecasting/data/retail_sales.csv`

## Option 2: Using Kaggle API (Advanced)

### 1. Install Kaggle API
```bash
pip install kaggle
```

### 2. Get API Credentials
1. Go to https://www.kaggle.com/settings
2. Scroll to "API" section
3. Click "Create New API Token"
4. Download `kaggle.json`
5. Place in:
   - Windows: `C:\Users\<username>\.kaggle\kaggle.json`
   - Linux/Mac: `~/.kaggle/kaggle.json`

### 3. Download Dataset
```bash
# Navigate to project directory
cd website/backend/website-backend/forecasting/data

# Download Supermarket Sales dataset
kaggle datasets download -d aungpyaeap/supermarket-sales

# Unzip
unzip supermarket-sales.zip

# Rename (if needed)
mv supermarket_sales.csv retail_sales.csv
```

## Option 3: Generate Sample Dataset (For Testing)

If you don't have a Kaggle account or want to test quickly:

```bash
cd website/backend/website-backend/forecasting
python train_models.py
# When prompted, choose 'y' to generate sample dataset
```

This creates a synthetic dataset with realistic patterns.

## After Downloading

Once you have the dataset in `website/backend/website-backend/forecasting/data/retail_sales.csv`:

1. **Train the models**:
```bash
cd website/backend/website-backend/forecasting
pip install -r requirements.txt
python train_models.py
```

2. **Test the predictions**:
```bash
python test_forecasting.py
```

3. **Start using the API endpoints**:
   - `/api/forecasting/demand` - Demand predictions
   - `/api/forecasting/price` - Price predictions

## Expected Dataset Format

The CSV should have these columns (names can vary):
- **Date/Invoice Date** - Transaction date
- **Product/Product Line** - Product name
- **Quantity/Qty** - Quantity sold
- **Price/Unit Price** - Product price
- **Category** (optional) - Product category

The data processor will automatically adapt to different column names!
