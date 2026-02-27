# DevTools Selector Testing Guide

This guide shows you how to find and test CSS selectors for web scraping.

## Quick Start

### Step 1: Open DevTools
1. Visit the website (e.g., https://lolohyper.mu or https://www.chez.mu/jumbo)
2. Press `F12` or `Right-click → Inspect`
3. Navigate to the **Console** tab

### Step 2: Find Product Containers
Test which selector captures all products:

```javascript
// Try different selectors until you find the right one
document.querySelectorAll('.product-item')
document.querySelectorAll('.product-card')
document.querySelectorAll('.promo-item')
document.querySelectorAll('[data-product]')
```

✅ **Good result**: Returns NodeList with multiple items
❌ **Bad result**: Returns empty NodeList or wrong elements

### Step 3: Test Individual Fields
Once you find the container, test selectors for each field:

```javascript
// Get the first product
const product = document.querySelector('.product-item');

// Test name selector
product.querySelector('.product-name')?.textContent
product.querySelector('h3')?.textContent
product.querySelector('.title')?.textContent

// Test price selector
product.querySelector('.price')?.textContent
product.querySelector('.sale-price')?.textContent
product.querySelector('[data-price]')?.getAttribute('data-price')

// Test image selector
product.querySelector('img')?.src
product.querySelector('img')?.getAttribute('data-src')

// Test brand selector
product.querySelector('.brand')?.textContent

// Test category selector
product.querySelector('.category')?.textContent
```

## Example: Complete Testing Session

### Lolo Hyper Example

```javascript
// 1. Navigate to: https://lolohyper.mu/promotions (or similar)

// 2. Find all products
const products = document.querySelectorAll('.product-card');
console.log(`Found ${products.length} products`);

// 3. Test on first product
const first = products[0];

// 4. Extract data
const data = {
  name: first.querySelector('.product-name')?.textContent?.trim(),
  price: first.querySelector('.price')?.textContent?.trim(),
  originalPrice: first.querySelector('.old-price')?.textContent?.trim(),
  image: first.querySelector('img')?.src,
  brand: first.querySelector('.brand')?.textContent?.trim(),
};

console.log(data);
```

## Common Selector Patterns

### Product Container Selectors
```javascript
'.product-item'
'.product-card'
'.promo-item'
'[data-product-id]'
'.deal-item'
'article.product'
'.grid-item'
```

### Name/Title Selectors
```javascript
'.product-name'
'.product-title'
'h3'
'h4'
'.title'
'.name'
'[data-product-name]'
```

### Price Selectors
```javascript
'.price'
'.product-price'
'.sale-price'
'.promo-price'
'[data-price]'
'.special-price'
```

### Image Selectors
```javascript
'img'                          // Most common
'img[data-src]'               // Lazy-loaded images
'.product-image img'
'[data-image-url]'
```

## Update Scrapers with Found Selectors

### 1. Lolo Hyper Scraper
Edit `lolo-hyper/lolo-hyper-scraper.ts` line ~78:

```typescript
const productSelectors = {
  container: '.YOUR-CONTAINER-SELECTOR',  // Update this
  name: '.YOUR-NAME-SELECTOR',            // Update this
  price: '.YOUR-PRICE-SELECTOR',          // Update this
  // ... etc
};
```

### 2. Jumbo Scraper
Edit `jumbo/jumbo-scraper.ts` line ~68:

```typescript
const selectors = {
  container: '.YOUR-CONTAINER-SELECTOR',
  name: '.YOUR-NAME-SELECTOR',
  price: '.YOUR-PRICE-SELECTOR',
};
```

### 3. Winners Scraper
Edit `winners/winners-scraper.ts` line ~68:

```typescript
const selectors = {
  container: '.YOUR-CONTAINER-SELECTOR',
  name: '.YOUR-NAME-SELECTOR',
  price: '.YOUR-PRICE-SELECTOR',
};
```

### 4. Shoprite Scraper
Edit `shoprite/shoprite-scraper.ts` line ~71:

```typescript
const selectors = {
  container: '.YOUR-CONTAINER-SELECTOR',
  name: '.YOUR-NAME-SELECTOR',
  price: '.YOUR-PRICE-SELECTOR',
};
```

## Tips & Tricks

### Multiple Fallback Selectors
Use comma separation for fallbacks:
```javascript
document.querySelector('.price, .sale-price, [data-price]')
```

### Testing Hierarchy
```javascript
// Test parent → child relationship
document.querySelector('.product-card .price')
document.querySelector('.product-card > .price')  // Direct child only
```

### Class with Spaces
```javascript
// If class="product card special"
document.querySelector('.product.card.special')  // All classes
document.querySelector('.product')               // First class only
```

### Data Attributes
```javascript
// For: <div data-product-id="123">
document.querySelector('[data-product-id]')
document.querySelector('[data-product-id="123"]')
```

## Testing Dynamic Content

Some websites load content with JavaScript. To test:

```javascript
// 1. Scroll to bottom to trigger lazy loading
window.scrollTo(0, document.body.scrollHeight);

// 2. Wait a moment, then test selectors
setTimeout(() => {
  const products = document.querySelectorAll('.product');
  console.log(`Found ${products.length} products after scroll`);
}, 2000);
```

If content only appears after scrolling/clicking, you'll need **Puppeteer** instead of cheerio.

## Verify Extracted Data

```javascript
// Test the full extraction logic
const products = [];
document.querySelectorAll('.product-item').forEach((el, i) => {
  const name = el.querySelector('.name')?.textContent?.trim();
  const price = el.querySelector('.price')?.textContent?.trim();
  
  if (name && price) {
    products.push({ name, price });
    console.log(`Product ${i + 1}: ${name} - ${price}`);
  }
});

console.log(`Total extracted: ${products.length} products`);
```

## Test Your Scraper

Once you've updated the selectors, test the scraper:

```typescript
import { LoloHyperScraper } from './scraping/lolo-hyper/lolo-hyper-scraper';

const scraper = new LoloHyperScraper();
const result = await scraper.scrapeDeals();

console.log(`Success: ${result.success}`);
console.log(`Products found: ${result.products.length}`);
console.log(`Errors: ${result.errors.join(', ')}`);

if (result.products.length > 0) {
  console.log('Sample product:', result.products[0]);
}
```

## Troubleshooting

### ❌ No products found
- **Check URL**: Is the promotions page at a different URL?
- **Test selector**: Does `document.querySelectorAll('YOUR_SELECTOR')` return results?
- **Dynamic content**: Does content load after page load? (Need Puppeteer)

### ❌ Empty product fields
- **Test selector**: Does the selector work in DevTools?
- **Check nesting**: Is the element nested differently than expected?
- **Wait for load**: Is content loaded via AJAX?

### ❌ Relative image URLs
The scraper handles this, but verify:
```javascript
// Relative: /images/product.jpg
// Absolute: https://www.site.com/images/product.jpg
```

## Next Steps

1. ✅ Test selectors for each retailer
2. ✅ Update scraper files with correct selectors
3. ✅ Run test scrapes to verify data
4. ✅ Save to database with `scrapeAndSave()`
5. ✅ Schedule regular scraping (cron job)

---

**Remember**: Websites change their HTML structure frequently. Test and update selectors regularly!
