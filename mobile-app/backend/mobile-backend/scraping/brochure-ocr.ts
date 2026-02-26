import { createWorker } from 'tesseract.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class BrochureOCRProcessor {
  /**
   * Process a brochure image or PDF URL and extract product details using OCR.
   * @param url The URL of the brochure (PDF or image)
   * @param title The title of the brochure
   * @param maxPages Maximum number of pages to process (default: 5)
   * @returns Array of extracted product objects (name, price, context)
   */
  async processBrochure(url: string, title: string, maxPages: number = 5): Promise<any[]> {
    if (url.match(/\.(jpg|jpeg|png)$/i)) {
      // Image URL
      return await this.ocrImageUrl(url, title);
    } else if (url.match(/\.pdf$/i)) {
      // PDF URL
      return await this.ocrPdfUrl(url, title, maxPages);
    } else {
      // Unknown format
      console.warn('Unknown brochure format for OCR:', url);
      return [];
    }
    /**
     * OCR for a PDF URL (converts each page to image, then runs OCR)
     */
    async ocrPdfUrl(pdfUrl: string, title: string, maxPages: number = 5): Promise<any[]> {
      const tempDir = path.join(__dirname, 'ocr-temp-pdf');
      const tempPdf = path.join(tempDir, 'brochure.pdf');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      try {
        // Download PDF
        const res = await fetch(pdfUrl);
        const buffer = await res.buffer();
        fs.writeFileSync(tempPdf, buffer);
        // Convert PDF pages to images using pdftoppm (requires poppler-utils)
        // Output: ocr-temp-pdf/page-1.jpg, page-2.jpg, ...
        execSync(`pdftoppm -jpeg -f 1 -l ${maxPages} "${tempPdf}" "${path.join(tempDir, 'page')}"`);
        // OCR each image
        const products: any[] = [];
        for (let i = 1; i <= maxPages; i++) {
          const imgPath = path.join(tempDir, `page-${i}.jpg`);
          if (!fs.existsSync(imgPath)) break;
          const worker = await createWorker('eng');
          const { data: { text } } = await worker.recognize(imgPath);
          await worker.terminate();
          products.push(...this.parseProductsFromText(text, title, pdfUrl + `#page=${i}`));
        }
        return products;
      } catch (err) {
        console.error('PDF OCR error:', err);
        return [];
      } finally {
        // Clean up temp files
        if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
        if (fs.existsSync(tempDir)) {
          fs.readdirSync(tempDir).forEach(f => fs.unlinkSync(path.join(tempDir, f)));
          fs.rmdirSync(tempDir);
        }
      }
    }
  }

  /**
   * OCR for a single image URL
   */
  async ocrImageUrl(imageUrl: string, title: string): Promise<any[]> {
    const worker = await createWorker('eng');
    let tempFile = path.join(__dirname, 'ocr-temp.jpg');
    try {
      // Download image
      const res = await fetch(imageUrl);
      const buffer = await res.buffer();
      fs.writeFileSync(tempFile, buffer);
      // OCR
      const { data: { text } } = await worker.recognize(tempFile);
      await worker.terminate();
      // Parse products from text
      return this.parseProductsFromText(text, title, imageUrl);
    } catch (err) {
      await worker.terminate();
      console.error('OCR error:', err);
      return [];
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  }

  /**
   * Parse product info from OCR text
   */
  parseProductsFromText(text: string, brochure: string, url: string): any[] {
    // Simple regex for product name and price (e.g., "Milk Rs 45.00")
    const lines = text.split(/\r?\n/);
    const products = [];
    for (const line of lines) {
      const match = line.match(/(.+?)\s+Rs\s*(\d+(?:\.\d{2})?)/i);
      if (match) {
        products.push({
          name: match[1].trim(),
          price: parseFloat(match[2]),
          context: line.trim(),
          brochure,
          url
        });
      }
    }
    return products;
  }
}
