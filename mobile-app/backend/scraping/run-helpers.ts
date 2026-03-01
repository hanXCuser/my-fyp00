import 'dotenv/config';
import { IntermartScraper } from './intermarkt/intermarkt-scraper.ts';
import { SuperUScraper } from './super-u/super-u-scraper.ts';
import { WinnersScraper } from './winners/winners-scraper.ts';

export interface ScrapeSummary {
  retailer: string;
  productsCreated: number;
  dealsCreated: number;
  errors: string[];
  extra?: Record<string, number>;
}

interface DateRange {
  startDate: string;
  endDate: string;
  startDateObj: Date;
  endDateObj: Date;
}

function requireSupermarketId(envKey: string): number {
  const raw = process.env[envKey];
  if (!raw) {
    throw new Error(`Missing ${envKey} in environment variables (.env)`);
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${envKey} value: ${raw}`);
  }

  return parsed;
}

function buildDateRange(daysAhead = 7): DateRange {
  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const startDate = now.toISOString().split('T')[0];
  const endDate = end.toISOString().split('T')[0];

  return { startDate, endDate, startDateObj: now, endDateObj: end };
}

export async function runSuperUScrape(): Promise<ScrapeSummary> {
  const supermarketId = requireSupermarketId('SUPERU_SUPERMARKET_ID');
  const { startDate, endDate } = buildDateRange();
  const scraper = new SuperUScraper();
  const result = await scraper.scrapeAndSave(supermarketId, startDate, endDate);

  return {
    retailer: 'Super U',
    productsCreated: result.productsCreated,
    dealsCreated: result.dealsCreated,
    errors: result.errors,
  };
}

export async function runWinnersScrape(): Promise<ScrapeSummary> {
  const supermarketId = requireSupermarketId('WINNERS_SUPERMARKET_ID');
  const { startDate, endDate } = buildDateRange();
  const scraper = new WinnersScraper();
  const result = await scraper.scrapeAndSave(supermarketId, startDate, endDate);

  return {
    retailer: 'Winners',
    productsCreated: result.productsCreated,
    dealsCreated: result.dealsCreated,
    errors: result.errors,
    extra: { brochuresSaved: result.brochuresSaved },
  };
}

export async function runIntermartScrape(): Promise<ScrapeSummary> {
  const supermarketId = requireSupermarketId('INTERMART_SUPERMARKET_ID');
  const { startDateObj, endDateObj } = buildDateRange();
  const scraper = new IntermartScraper();
  const result = await scraper.scrapeAndSave(supermarketId, startDateObj, endDateObj);

  return {
    retailer: 'Intermart',
    productsCreated: result.productsCreated,
    dealsCreated: result.dealsCreated,
    errors: [],
  };
}