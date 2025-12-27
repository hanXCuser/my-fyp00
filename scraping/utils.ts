import axios, { AxiosInstance } from 'axios';
import { ScraperConfig } from './types';

export class ScraperUtils {
  private axiosInstance: AxiosInstance;

  constructor(config: ScraperConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...config.headers,
      },
      timeout: config.timeout || 30000,
    });
  }

  async fetchPage(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.axiosInstance.get(url);
        return response.data;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1));
      }
    }
    throw new Error('Failed to fetch page after retries');
  }

  async fetchJson<T>(url: string, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.axiosInstance.get<T>(url);
        return response.data;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1));
      }
    }
    throw new Error('Failed to fetch JSON after retries');
  }

  async postJson<T>(url: string, data: any, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.axiosInstance.post<T>(url, data);
        return response.data;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1));
      }
    }
    throw new Error('Failed to post JSON after retries');
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  extractPrice(priceString: string): number {
    // Remove currency symbols and convert to number
    const cleaned = priceString.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  generateProductId(supermarket: string, productName: string): string {
    const hash = this.simpleHash(`${supermarket}-${productName}`);
    return `${supermarket.toLowerCase()}-${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  sanitizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }
}
