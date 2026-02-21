import { ScrapedProduct } from './types';
import * as tesseract from 'tesseract.js';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export interface ExtractedProduct {
  name: string;
  salePrice: number;
  originalPrice?: number;
  discount?: number;
  unit?: string;
  brand?: string;
}

export class BrochureOCRProcessor {
  private browser: Browser | null = null;

  /**
   * Process a Paperturn brochure URL and extract products using OCR
   */
  async processBrochure(url: string, dealTitle: string, maxPages = 5): Promise<ScrapedProduct[]> {
    console.log(`🔍 Starting OCR processing for: ${url}`);
    const products: ScrapedProduct[] = [];

    try {
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to brochure
      console.log('📄 Loading brochure page...');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for Paperturn viewer to load
      await page.waitForSelector('.mag-canvas, .paperturn-page, canvas', { timeout: 10000 }).catch(() => {
        console.warn('⚠️  Paperturn viewer elements not found, continuing...');
      });

      // Give it extra time to render
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Process pages
      for (let pageNum = 0; pageNum < maxPages; pageNum++) {
        console.log(`📸 Processing page ${pageNum + 1}/${maxPages}...`);

        try {
          // Take screenshot of current page
          const screenshot = await page.screenshot({
            type: 'png',
            fullPage: false,
          });

          // Convert Uint8Array to Buffer
          const screenshotBuffer = Buffer.from(screenshot);

          // Debug: Save screenshot for inspection
          const debugDir = path.join(__dirname, 'winners', 'debug-screenshots');
          if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true });
          }
          const screenshotPath = path.join(debugDir, `page-${pageNum + 1}.png`);
          fs.writeFileSync(screenshotPath, screenshotBuffer);
          console.log(`💾 Saved screenshot: ${screenshotPath}`);

          // Perform OCR on the screenshot
          const text = await this.performOCR(screenshotBuffer);
          
          // Debug: Show extracted text
          if (text.trim().length > 0) {
            console.log(`📝 Extracted text (${text.length} chars): ${text.substring(0, 200)}...`);
          } else {
            console.log(`⚠️  No text extracted from page ${pageNum + 1}`);
          }
          
          // Extract products from OCR text
          const pageProducts = this.extractProductsFromText(text);
          // Set dealTitle for all products from this brochure
          pageProducts.forEach(p => p.dealTitle = dealTitle);
          products.push(...pageProducts);

          console.log(`✓ Found ${pageProducts.length} products on page ${pageNum + 1}`);

          // Try to navigate to next page
          if (pageNum < maxPages - 1) {
            const navigated = await this.navigateToNextPage(page);
            if (!navigated) {
              console.log('⚠️  Could not navigate to next page, stopping');
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to render
          }

        } catch (error: any) {
          console.error(`❌ Error processing page ${pageNum + 1}:`, error.message);
          break;
        }
      }

      await this.browser.close();
      this.browser = null;

      console.log(`✅ OCR completed: ${products.length} total products found`);
      return products;

    } catch (error: any) {
      console.error('❌ OCR processing failed:', error.message);
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      return [];
    }
  }

  /**
   * Perform OCR on an image buffer with preprocessing
   */
  private async performOCR(imageBuffer: Buffer): Promise<string> {
    try {
      const sharp = require('sharp');
      
      // Preprocess image for better OCR accuracy
      const preprocessedBuffer = await sharp(imageBuffer)
        .resize(3000, null, { // Upscale to higher resolution
          kernel: sharp.kernel.lanczos3,
          fit: 'inside',
          withoutEnlargement: false
        })
        .greyscale() // Convert to grayscale
        .normalize() // Auto-adjust levels for better contrast
        .sharpen({ sigma: 1 }) // Sharpen text edges
        .linear(1.5, -(128 * 0.5)) // Increase contrast
        .toBuffer();
      
      const { data } = await tesseract.recognize(preprocessedBuffer, 'eng', {
        logger: () => {}, // Suppress tesseract logs
      });
      return data.text;
    } catch (error: any) {
      console.error('❌ OCR recognition failed:', error.message);
      return '';
    }
  }

  /**
   * Navigate to next page in Paperturn viewer
   */
  private async navigateToNextPage(page: Page): Promise<boolean> {
    try {
      // Try multiple methods to navigate to next page
      
      // Method 1: Click next button
      const nextButtonSelectors = [
        '.mag-next',
        '.next-page',
        'button[aria-label*="next"]',
        'a[aria-label*="next"]',
        '.paperturn-next',
      ];

      for (const selector of nextButtonSelectors) {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          return true;
        }
      }

      // Method 2: Use keyboard arrow key
      await page.keyboard.press('ArrowRight');
      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Extract products from OCR text
   */
  private extractProductsFromText(text: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for price patterns - more flexible matching
      // Match: Rs 123, Rs 123.45, MUR 123, or standalone numbers like 199.95
      const priceMatch = line.match(/(?:Rs|MUR)?\s*(\d+(?:[.,]\d{2}))/i) || 
                        line.match(/\b(\d{2,4}\.\d{2})\b/);  // Matches 99.95, 199.95, etc
      
      if (priceMatch) {
        const priceStr = priceMatch[1].replace(',', '.');
        const price = parseFloat(priceStr);
        
        // Filter out unrealistic prices
        if (price < 10 || price > 10000) continue;
        
        // Try to find product name in previous lines or same line
        let productName = '';
        let searchLines: string[] = [];
        
        // Collect potential product name lines (look back up to 3 lines)
        const lookBackLines = Math.min(3, i);
        for (let j = i - lookBackLines; j < i; j++) {
          if (j >= 0) {
            searchLines.push(lines[j]);
          }
        }
        
        // Also check same line before price
        const beforePrice = line.substring(0, priceMatch.index).trim();
        if (beforePrice.length > 3) {
          searchLines.push(beforePrice);
        }
        
        // Find the best product name candidate
        for (const candidate of searchLines.reverse()) {
          if (this.isValidProductName(candidate)) {
            productName = candidate;
            break;
          }
        }
        
        // If no valid name found, skip this product
        if (!productName) continue;

        // Look for original price nearby (strikethrough/was price)
        let originalPrice: number | undefined;
        let discount: number | undefined;

        // Check next line for another price (might be original price)
        if (i < lines.length - 1) {
          const nextLine = lines[i + 1];
          const nextPriceMatch = nextLine.match(/\b(\d{2,4}\.\d{2})\b/);
          if (nextPriceMatch) {
            const nextPrice = parseFloat(nextPriceMatch[1]);
            if (nextPrice > price && nextPrice < 10000) {
              originalPrice = nextPrice;
            }
          }
        }

        // Look for multiple prices on same line
        const allPrices = [...line.matchAll(/\b(\d{2,4}\.\d{2})\b/g)]
          .map(m => parseFloat(m[1]))
          .filter(p => p >= 10 && p < 10000);
        
        if (allPrices.length === 2) {
          // Two prices on same line - likely sale price and original price
          const [first, second] = allPrices;
          if (second > first) {
            originalPrice = second;
          } else if (first > second) {
            originalPrice = first;
          }
        }

        // Look for discount percentage
        const discountMatch = line.match(/(\d+)%\s*(?:off|discount|save|OFF)/i);
        if (discountMatch) {
          discount = parseInt(discountMatch[1]);
          
          // Calculate original price if we have discount but not original price
          if (!originalPrice && discount > 0 && discount < 100) {
            originalPrice = Math.round((price / (1 - discount / 100)) * 100) / 100;
          }
        }

        // Calculate discount if we have both prices but no discount
        if (originalPrice && !discount && originalPrice > price) {
          discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        }

        const cleanedName = this.cleanProductName(productName);
        
        // Final validation before adding
        if (this.isValidProductName(cleanedName) && price > 0) {
          // Debug logging for price extraction
          if (originalPrice) {
            console.log(`  💰 Product: ${cleanedName.substring(0, 30)}... | Sale: Rs ${price} | Original: Rs ${originalPrice} | Discount: ${discount}%`);
          } else {
            console.log(`  💰 Product: ${cleanedName.substring(0, 30)}... | Price: Rs ${price} (no original price found)`);
          }
          
          products.push({
            name: cleanedName,
            price,
            originalPrice,
            discount,
            category: this.categorizeProduct(productName),
          });
        }
      }
    }

    return products;
  }

  /**
   * Validate if text looks like a valid product name
   */
  private isValidProductName(text: string): boolean {
    if (!text || text.length < 5) return false;
    
    // Skip if it's a date pattern
    if (text.match(/^\d{1,2}\s+(?:AU|FEVRIER|FEBRUARY|JANVIER|MARS|AVRIL)/i)) return false;
    
    // Skip if it looks like a page header/footer
    if (text.match(/^(search|overview|download|print|share|accessibility|winners|tribeca)/i)) return false;
    
    // Skip if it's mostly special characters or numbers
    const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    if (totalChars > 0 && alphaCount / totalChars < 0.4) return false;
    
    // Skip if it has too many consecutive special chars
    if (text.match(/[^\w\s]{3,}/)) return false;
    
    // Skip single words that are too short
    const words = text.split(/\s+/);
    if (words.length === 1 && words[0].length < 5) return false;
    
    // Must have at least one word with 3+ letters
    const hasValidWord = words.some(word => word.replace(/[^a-zA-Z]/g, '').length >= 3);
    if (!hasValidWord) return false;
    
    return true;
  }

  /**
   * Clean and normalize product name
   */
  private cleanProductName(name: string): string {
    return name
      .replace(/[^\w\s-]/g, ' ') // Remove special chars except hyphens
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim()
      .toUpperCase();
  }

  /**
   * Simple category detection
   */
  private categorizeProduct(name: string): string {
    const nameLower = name.toLowerCase();
    
    const categories: Record<string, string[]> = {
      'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream'],
      'Beverages': ['juice', 'drink', 'water', 'tea', 'coffee', 'soda'],
      'Meat & Poultry': ['chicken', 'beef', 'pork', 'meat'],
      'Bakery': ['bread', 'buns', 'rolls'],
      'Fresh Produce': ['fruit', 'vegetable', 'lettuce', 'tomato'],
      'Pantry': ['pasta', 'rice', 'flour', 'sugar', 'oil'],
      'Snacks': ['chips', 'biscuits', 'cookies', 'crackers'],
      'Personal Care': ['soap', 'shampoo', 'toothpaste'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }
}