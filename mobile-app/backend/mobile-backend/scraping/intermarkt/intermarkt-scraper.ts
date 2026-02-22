import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import Tesseract from 'tesseract.js';
import { DatabaseService } from '../database';
import { ScrapedProduct } from '../types';
import { supabase } from '../supabase-node';

export class IntermartScraper {
  private website = 'https://intermartmauritius.com/nos-activites/notre-offre/promotions-2/';
  private tempDir = path.join(__dirname, 'temp-pdfs');
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Find the latest brochure PDF URL from the promotions page
   */
  async findLatestBrochureURL(): Promise<string | null> {
    console.log('Looking for latest Intermarkt brochure...');
    
    try {
      const response = await axios.get(this.website);
      const $ = cheerio.load(response.data);
      
      // Look for links to catalog images (they're in <a> tags, not <img> tags)
      const catalogImages = $('a[href*="PAGE-"]')
        .map((i, el) => $(el).attr('href'))
        .get()
        .filter(src => src && src.includes('wp-content/uploads') && src.includes('2026'))
        .sort(); // Sort to ensure correct page order

      if (catalogImages.length > 0) {
        console.log(`Found ${catalogImages.length} catalog page images (using direct images)`);
        return 'IMAGES:' + JSON.stringify(catalogImages);
      }

      // Also check img tags as fallback
      const imgTags = $('img[src*="PAGE-"]')
        .map((i, el) => $(el).attr('src'))
        .get()
        .filter(src => src && src.includes('wp-content/uploads') && src.includes('2026'))
        .sort();

      if (imgTags.length > 0) {
        console.log(`Found ${imgTags.length} catalog page images from img tags`);
        return 'IMAGES:' + JSON.stringify(imgTags);
      }

      // Fallback: Look for PDF download link
      const pdfLink = $('a[href*=".pdf"]').filter((i, el) => {
        const href = $(el).attr('href') || '';
        return href.includes('INTERMART') || href.includes('BROCHURE');
      }).first();
      
      if (pdfLink.length > 0) {
        const url = pdfLink.attr('href');
        console.log(`Found brochure PDF: ${url}`);
        return url || null;
      }

      console.log('Warning: No brochure found');
      return null;

    } catch (error: any) {
      console.error(`Error finding brochure: ${error.message}`);
      return null;
    }
  }

  /**
   * Download PDF from URL
   */
  async downloadPDF(pdfUrl: string): Promise<string> {
    console.log(`Downloading PDF from: ${pdfUrl}`);
    
    const fileName = `intermarkt-brochure-${Date.now()}.pdf`;
    const filePath = path.join(this.tempDir, fileName);

    try {
      const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      fs.writeFileSync(filePath, response.data);
      console.log(`PDF downloaded to: ${filePath}`);
      return filePath;

    } catch (error: any) {
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }

  /**
   * Download catalog images directly
   */
  async downloadImages(imageUrls: string[]): Promise<Buffer[]> {
    console.log(`Downloading ${imageUrls.length} catalog images...`);
    const images: Buffer[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const response = await axios.get(imageUrls[i], {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        images.push(Buffer.from(response.data));
        console.log(`Downloaded image ${i + 1}/${imageUrls.length}`);

      } catch (error) {
        console.error(`Failed to download image ${i + 1}`);
      }
    }

    return images;
  }

  /**
   * Convert PDF to images using Puppeteer
   */
  async convertPDFToImages(pdfPath: string): Promise<Buffer[]> {
    console.log('Converting PDF to images...');
    
    try {
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1600 });
      
      // Read and validate PDF
      const pdfBuffer = fs.readFileSync(pdfPath);
      if (pdfBuffer.length === 0) {
        throw new Error('PDF file is empty');
      }
      
      console.log(`PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      
      // Convert to data URL
      const base64PDF = pdfBuffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64PDF}`;
      
      // Navigate to PDF
      await page.goto(dataUrl, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Capture full page
      const screenshot = await page.screenshot({ 
        fullPage: true,
        type: 'png',
        encoding: 'binary'
      }) as Buffer;
      
      await browser.close();
      
      if (screenshot.length === 0) {
        throw new Error('Screenshot is empty');
      }
      
      console.log(`Captured screenshot: ${(screenshot.length / 1024).toFixed(2)} KB`);
      return [screenshot];
      
    } catch (error: any) {
      console.error(`Error converting PDF: ${error.message}`);
      return [];
    }
  }

  /**
   * Perform OCR on image buffer with preprocessing
   */
  async performOCR(imageBuffer: Buffer): Promise<string> {
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
      
      const { data: { text } } = await Tesseract.recognize(
        preprocessedBuffer,
        'eng+fra',
        {
          logger: () => {}, // Suppress verbose logging
        }
      );
      
      // Debug: Save OCR text to file
      if (process.env.DEBUG_OCR === 'true') {
        const debugDir = path.join(this.tempDir, 'ocr-output');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        const timestamp = Date.now();
        fs.writeFileSync(path.join(debugDir, `ocr-text-${timestamp}.txt`), text);
        fs.writeFileSync(path.join(debugDir, `preprocessed-${timestamp}.png`), preprocessedBuffer);
      }
      
      console.log(`   OCR extracted ${text.length} characters`);
      return text;
    } catch (error: any) {
      console.error(`OCR error: ${error.message}`);
      return '';
    }
  }

  /**
   * Parse products from OCR text
   */
  parseProducts(text: string, pageNumber: number): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    console.log(`   Page ${pageNumber}: Analyzing ${lines.length} text lines`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const context = this.getContextLines(lines, i, 3); // Get 3 lines before and after
      
      // Look for price patterns (Rs 150, Rs150.00, 150.00, etc.)
      const priceMatch = line.match(/Rs?\s*(\d+(?:[.,]\d{2})?)/i);
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(',', '.'));
        
        // Filter out unrealistic prices (OCR errors)
        if (price < 1 || price > 5000) {
          continue; // Skip prices < Rs 1 or > Rs 5000
        }
        
        // Get product name from surrounding lines
        const productName = this.extractProductName(lines, i);
        
        // Filter out garbled product names (too short or too many special chars)
        if (!this.isValidProductName(productName)) {
          console.log(`   ⚠️  Rejected invalid name: "${productName}" (price: Rs ${price})`);
          continue;
        }
        
        if (productName && price > 0) {
          // Extract discount percentage
          let discount = this.extractDiscount(context);
          
          // Extract original price (strikethrough)
          const originalPrice = this.extractOriginalPrice(context, price);
          
          // Validate original price if present
          if (originalPrice && originalPrice <= price) {
            // Original price should be higher than deal price
            continue;
          }
          
          // Calculate discount if we have both prices but no discount found in text
          if (originalPrice && !discount) {
            discount = Math.round(((originalPrice - price) / originalPrice) * 100);
          }
          
          const product = {
            name: productName,
            price: price,
            originalPrice: originalPrice,
            discount: discount,
            unit: this.extractUnit(line),
            brand: this.extractBrand(line),
            category: this.extractCategory(productName),
            image_url: undefined,
            description: line.substring(0, 200),
            dealTitle: 'Intermart Weekly Specials',
          };
          
          products.push(product);
          
          if (originalPrice) {
            console.log(`   ✓ ${productName.substring(0, 40)}... - Rs ${price} (was Rs ${originalPrice}, ${discount}% off)`);
          } else {
            console.log(`   ✓ ${productName.substring(0, 40)}... - Rs ${price}`);
          }
        }
      }
    }

    return products;
  }

  /**
   * Validate product name quality
   */
  private isValidProductName(name: string | undefined): boolean {
    if (!name || name.length < 3) return false;
    
    // Check ratio of special characters to total length
    const specialCharCount = (name.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const ratio = specialCharCount / name.length;
    
    // Reject if more than 50% special characters or name is too short
    if (ratio > 0.5) return false;
    
    // Must have at least one letter
    if (!/[a-zA-Z]/.test(name)) return false;
    
    return true;
  }

  /**
   * Get context lines around current index
   */
  private getContextLines(lines: string[], currentIndex: number, range: number): string {
    const start = Math.max(0, currentIndex - range);
    const end = Math.min(lines.length, currentIndex + range + 1);
    return lines.slice(start, end).join(' ');
  }

  /**
   * Extract discount percentage from text
   */
  private extractDiscount(text: string): number | undefined {
    // Look for patterns like: -20%, 20%, -50, 50% OFF, etc.
    const discountPatterns = [
      /-\s*(\d+)\s*%/,           // -20%, - 20%
      /(\d+)\s*%\s*OFF/i,        // 20% OFF, 20 % OFF
      /(\d+)\s*%\s*DISCOUNT/i,   // 20% DISCOUNT
      /SAVE\s*(\d+)\s*%/i,       // SAVE 20%
      /REDUCTION\s*(\d+)\s*%/i,  // REDUCTION 20%
      /-(\d+)\s*Rs/i,            // -50Rs (discount amount)
      /\b(\d{1,2})\s*%(?!\s*\d)/,  // Standalone percentage (20%)
    ];

    for (const pattern of discountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const discountValue = parseInt(match[1]);
        // Valid discounts: 5% to 90%
        if (discountValue >= 5 && discountValue <= 90) {
          return discountValue;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract original/strikethrough price
   */
  private extractOriginalPrice(text: string, currentPrice: number): number | undefined {
    // Look for multiple price mentions - the higher one is likely the original
    const priceMatches = text.match(/Rs?\s*(\d+(?:[.,]\d{2})?)/gi);
    
    if (priceMatches && priceMatches.length > 1) {
      const prices = priceMatches
        .map(p => parseFloat(p.replace(/Rs?\s*/i, '').replace(',', '.')))
        .filter(p => {
          // Original price should be higher but not unrealistically higher
          const isHigher = p > currentPrice;
          const isRealistic = p < currentPrice * 3; // Max 3x the deal price
          const isNotTooHigh = p <= 5000; // Max Rs 5000
          return isHigher && isRealistic && isNotTooHigh;
        });
      
      if (prices.length > 0) {
        // Return the smallest valid original price (most likely correct)
        return Math.min(...prices);
      }
    }

    return undefined;
  }

  /**
   * Extract product name from surrounding lines
   */
  private extractProductName(lines: string[], currentIndex: number): string {
    // Look at current line and 1-2 lines before/after
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(lines.length, currentIndex + 3);
    
    const relevantLines = lines.slice(start, end);
    
    // Filter out lines that are just prices or very short
    const nameLines = relevantLines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 3 && 
             !trimmed.match(/^Rs?\s*\d+/i) &&
             !trimmed.match(/^\d+\s*Rs/i);
    });

    if (nameLines.length > 0) {
      return nameLines[0].trim().substring(0, 100);
    }

    return 'Unknown Product';
  }

  /**
   * Extract unit from text (kg, g, ml, l, piece, pack)
   */
  private extractUnit(text: string): string | undefined {
    const unitMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|piece|pack|pcs|unit)/i);
    return unitMatch ? `${unitMatch[1]}${unitMatch[2].toLowerCase()}` : undefined;
  }

  /**
   * Extract brand from text
   */
  private extractBrand(text: string): string | undefined {
    // Common brands in Mauritius
    const brands = ['Nestle', 'Coca-Cola', 'Pepsi', 'Danone', 'Unilever', 'Procter'];
    
    for (const brand of brands) {
      if (text.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    return undefined;
  }

  /**
   * Extract category based on keywords
   */
  private extractCategory(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('yogurt')) {
      return 'Dairy';
    } else if (lower.includes('bread') || lower.includes('cake') || lower.includes('pastry')) {
      return 'Bakery';
    } else if (lower.includes('chicken') || lower.includes('beef') || lower.includes('fish')) {
      return 'Meat & Seafood';
    } else if (lower.includes('apple') || lower.includes('banana') || lower.includes('orange')) {
      return 'Fruits';
    } else if (lower.includes('carrot') || lower.includes('tomato') || lower.includes('potato')) {
      return 'Vegetables';
    } else if (lower.includes('shampoo') || lower.includes('soap') || lower.includes('detergent')) {
      return 'Household';
    }
    
    return 'General';
  }

  /**
   * Main scraping function
   */
  async scrapeDeals(): Promise<ScrapedProduct[]> {
    console.log('\nStarting Intermarkt scraper...\n');

    try {
      // Find brochure URL
      const brochureInfo = await this.findLatestBrochureURL();
      
      if (!brochureInfo) {
        console.log('No brochure found');
        return [];
      }

      let images: Buffer[] = [];

      // Check if it's image URLs or PDF
      if (brochureInfo.startsWith('IMAGES:')) {
        const imageUrls = JSON.parse(brochureInfo.substring(7));
        images = await this.downloadImages(imageUrls);
      } else {
        // Download PDF
        const pdfPath = await this.downloadPDF(brochureInfo);
        
        // Convert to images
        images = await this.convertPDFToImages(pdfPath);
        
        // Clean up PDF
        fs.unlinkSync(pdfPath);
        console.log('Cleaned up temporary PDF file');
      }

      if (images.length === 0) {
        console.log('No images to process');
        return [];
      }

      // Process each image with OCR
      console.log(`\nPerforming OCR on ${images.length} image(s)...`);
      const allProducts: ScrapedProduct[] = [];

      for (let i = 0; i < images.length; i++) {
        console.log(`Processing image ${i + 1}/${images.length}...`);
        const text = await this.performOCR(images[i]);
        const products = this.parseProducts(text, i + 1);
        allProducts.push(...products);
        console.log(`Extracted ${products.length} products`);
      }

      console.log(`\nTotal products extracted: ${allProducts.length}\n`);
      return allProducts;

    } catch (error: any) {
      console.error(`\nScraping failed: ${error.message}\n`);
      return [];
    }
  }

  /**
   * Save brochure to database
   */
  private async saveBrochure(
    supermarketId: number,
    brochureUrl: string,
    startDate: Date,
    endDate: Date,
    uploadedBy: number = 1
  ): Promise<number | null> {
    try {
      // Check if brochure already exists
      const { data: existing } = await supabase
        .from('pamphlets')
        .select('pamphlet_id')
        .eq('file_url', brochureUrl)
        .eq('supermarket_id', supermarketId)
        .maybeSingle();

      if (existing) {
        console.log(`📖 Brochure already exists (ID: ${existing.pamphlet_id})`);
        return existing.pamphlet_id;
      }

      // Insert new brochure
      const { data, error } = await supabase
        .from('pamphlets')
        .insert({
          supermarket_id: supermarketId,
          uploaded_by: uploadedBy,
          uploaded_date: new Date().toISOString().split('T')[0],
          file_url: brochureUrl,
          valid_from: startDate.toISOString().split('T')[0],
          valid_to: endDate.toISOString().split('T')[0],
          status: 'processed',
        })
        .select('pamphlet_id')
        .single();

      if (error) throw error;

      console.log(`✅ Saved brochure (ID: ${data.pamphlet_id})`);
      return data.pamphlet_id;
    } catch (error: any) {
      console.error(`❌ Error saving brochure: ${error.message}`);
      return null;
    }
  }

  /**
   * Scrape and save to database
   */
  async scrapeAndSave(
    supermarket_id: number,
    startDate: Date,
    endDate: Date,
    pdfUrl?: string
  ): Promise<{ productsCreated: number; dealsCreated: number }> {
    console.log('\nStarting Intermarkt scraper with database save...\n');

    try {
      let images: Buffer[] = [];
      let brochureUrl: string;

      if (pdfUrl) {
        // Use provided URL
        if (pdfUrl.startsWith('IMAGES:')) {
          const imageUrls = JSON.parse(pdfUrl.substring(7));
          images = await this.downloadImages(imageUrls);
          brochureUrl = imageUrls[0]; // Use first image URL as reference
        } else {
          brochureUrl = pdfUrl;
          const pdfPath = await this.downloadPDF(pdfUrl);
          images = await this.convertPDFToImages(pdfPath);
          fs.unlinkSync(pdfPath);
        }
      } else {
        // Auto-detect
        const brochureInfo = await this.findLatestBrochureURL();
        if (!brochureInfo) throw new Error('No brochure found');
        brochureUrl = brochureInfo;

        if (brochureInfo.startsWith('IMAGES:')) {
          const imageUrls = JSON.parse(brochureInfo.substring(7));
          images = await this.downloadImages(imageUrls);
          brochureUrl = imageUrls[0]; // Use first image URL as reference
        } else {
          const pdfPath = await this.downloadPDF(brochureInfo);
          images = await this.convertPDFToImages(pdfPath);
          fs.unlinkSync(pdfPath);
        }
      }

      // Save brochure to pamphlets table
      const pamphlet_id = await this.saveBrochure(supermarket_id, brochureUrl, startDate, endDate);

      // Process images
      const allProducts: ScrapedProduct[] = [];
      for (let i = 0; i < images.length; i++) {
        console.log(`Processing image ${i + 1}/${images.length}...`);
        const text = await this.performOCR(images[i]);
        const products = this.parseProducts(text, i + 1);
        allProducts.push(...products);
      }

      console.log(`Extracted ${allProducts.length} products`);

      // Save to database
      console.log('Saving to database...');
      
      // Get retailer ID
      const retailer_id = await this.db.getOrCreateRetailer(
        'Intermarkt',
        'https://intermartmauritius.com/',
        'Intermarkt Mauritius - Your neighborhood supermarket offering quality products at competitive prices'
      );

      const { productsCreated, dealsCreated } = await this.db.saveScrapedData(
        retailer_id,
        supermarket_id,
        allProducts,
        'pamphlet',
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        pamphlet_id || undefined
      );

      console.log(`Successfully saved to database!`);
      console.log(`Products: ${productsCreated}`);
      console.log(`Deals: ${dealsCreated}\n`);

      return { productsCreated, dealsCreated };

    } catch (error: any) {
      console.error(`Error: ${error.message}\n`);
      throw error;
    }
  }
}
