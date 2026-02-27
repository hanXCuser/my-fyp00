import { supabase } from '../scraping/supabase-node';

type RecommendationContext = {
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  category?: string;
  limit?: number;
};

type UserPreferenceProfile = {
  favouriteProductIds: Set<number>;
  categories: Set<string>;
  brands: Set<string>;
};

type DealRecord = {
  deal_id: number;
  product_id: number;
  retailer_id: number;
  supermarket_id?: number | null;
  title?: string | null;
  deal_price: number;
  original_price?: number | null;
  discount?: number | null;
  start_date: string;
  end_date: string;
  products?: {
    product_id: number;
    name: string;
    category?: string | null;
    brand?: string | null;
  } | null;
  retailers?: {
    name: string;
  } | null;
};

type Recommendation = {
  product_id: number;
  product_name: string;
  category: string;
  retailer: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  supermarket_id: number;
  supermarket_name: string;
  distance?: number;
  reason: string;
  score: number;
  valid_from: string;
  valid_to: string;
};

type ScoredRecommendation = Recommendation;

const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_DISTANCE = 10;

export async function getPersonalizedDeals(
  userId: string,
  context: RecommendationContext = {}
): Promise<Recommendation[]> {
  const [preferences, deals, retailerDistanceMap] = await Promise.all([
    getUserPreferenceProfile(userId),
    fetchActiveDeals(),
    getRetailerDistanceMap(context),
  ]);

  const scored = deals
    .map((deal) => scorePersonalizedDeal(deal, preferences, retailerDistanceMap, context))
    .filter((recommendation): recommendation is ScoredRecommendation => recommendation !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, context.limit ?? DEFAULT_LIMIT);

  return scored;
}

export async function getSmartSuggestions(
  userId: string,
  context: RecommendationContext = {}
): Promise<Recommendation[]> {
  const [preferences, deals, retailerDistanceMap] = await Promise.all([
    getUserPreferenceProfile(userId),
    fetchActiveDeals(),
    getRetailerDistanceMap(context),
  ]);

  const scored = deals
    .map((deal) => scoreSmartDeal(deal, preferences, retailerDistanceMap, context))
    .filter((recommendation): recommendation is ScoredRecommendation => recommendation !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, context.limit ?? DEFAULT_LIMIT);

  return scored;
}

export async function getTrendingDeals(
  context: RecommendationContext = {}
): Promise<Recommendation[]> {
  const [deals, retailerDistanceMap] = await Promise.all([
    fetchActiveDeals(context.category),
    getRetailerDistanceMap(context),
  ]);

  return deals
    .map((deal) => scoreTrendingDeal(deal, retailerDistanceMap, context))
    .filter((recommendation): recommendation is ScoredRecommendation => recommendation !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, context.limit ?? DEFAULT_LIMIT);
}

export async function getSimilarProducts(
  productId: number,
  context: RecommendationContext = {}
): Promise<Recommendation[]> {
  const [targetProduct, deals, retailerDistanceMap] = await Promise.all([
    getProductMeta(productId),
    fetchActiveDeals(),
    getRetailerDistanceMap(context),
  ]);

  if (!targetProduct) {
    return [];
  }

  return deals
    .filter((deal) => deal.product_id !== productId)
    .map((deal) => scoreSimilarDeal(deal, targetProduct, retailerDistanceMap, context))
    .filter((recommendation): recommendation is ScoredRecommendation => recommendation !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, context.limit ?? 10);
}

async function getUserPreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
  const [favouritesRes, listRes] = await Promise.all([
    supabase
      .from('user_favourites')
      .select(`
        product_id,
        products (
          category,
          brand
        )
      `)
      .eq('user_id', userId),
    supabase
      .from('list_items')
      .select(`
        product_id,
        shopping_lists!inner (
          user_id
        ),
        products (
          category,
          brand
        )
      `)
      .eq('shopping_lists.user_id', userId),
  ]);

  if (favouritesRes.error) {
    console.error('Error loading favourites for recommendations:', favouritesRes.error);
  }

  if (listRes.error) {
    console.error('Error loading list items for recommendations:', listRes.error);
  }

  const favouriteProductIds = new Set<number>();
  const categories = new Set<string>();
  const brands = new Set<string>();

  for (const item of favouritesRes.data || []) {
    const row = item as any;
    if (row.product_id) {
      favouriteProductIds.add(Number(row.product_id));
    }
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    if (product?.category) {
      categories.add(String(product.category).toLowerCase());
    }
    if (product?.brand) {
      brands.add(String(product.brand).toLowerCase());
    }
  }

  for (const item of listRes.data || []) {
    const row = item as any;
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    if (product?.category) {
      categories.add(String(product.category).toLowerCase());
    }
    if (product?.brand) {
      brands.add(String(product.brand).toLowerCase());
    }
  }

  return { favouriteProductIds, categories, brands };
}

async function fetchActiveDeals(category?: string): Promise<DealRecord[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('deals')
    .select(`
      deal_id,
      product_id,
      retailer_id,
      supermarket_id,
      title,
      deal_price,
      original_price,
      discount,
      start_date,
      end_date,
      products (
        product_id,
        name,
        category,
        brand
      ),
      retailers (
        name
      )
    `)
    .gte('end_date', today)
    .order('discount', { ascending: false })
    .order('deal_price', { ascending: true });

  if (error) {
    console.error('Error fetching active deals for recommendations:', error);
    return [];
  }

  const deals = (data || []) as unknown as DealRecord[];

  if (!category) {
    return deals;
  }

  const normalizedCategory = category.toLowerCase();
  return deals.filter((deal) => {
    const dealCategory = deal.products?.category?.toLowerCase();
    return Boolean(dealCategory && dealCategory === normalizedCategory);
  });
}

async function getProductMeta(productId: number) {
  const { data, error } = await supabase
    .from('products')
    .select('product_id, category, brand')
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    console.error('Error loading product meta for similar recommendations:', error);
    return null;
  }

  return data;
}

async function getRetailerDistanceMap(context: RecommendationContext): Promise<Map<number, number>> {
  if (context.latitude === undefined || context.longitude === undefined) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('supermarkets')
    .select('retailer_id, latitude, longitude, is_active')
    .eq('is_active', true)
    .not('retailer_id', 'is', null)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) {
    console.error('Error loading supermarkets for distance scoring:', error);
    return new Map();
  }

  const map = new Map<number, number>();

  for (const row of data || []) {
    const item = row as any;
    const retailerId = Number(item.retailer_id);
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);

    if (!Number.isFinite(retailerId) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    const distanceKm = calculateDistanceKm(
      context.latitude,
      context.longitude,
      latitude,
      longitude
    );

    const existing = map.get(retailerId);
    if (existing === undefined || distanceKm < existing) {
      map.set(retailerId, distanceKm);
    }
  }

  return map;
}

function scorePersonalizedDeal(
  deal: DealRecord,
  preferences: UserPreferenceProfile,
  retailerDistanceMap: Map<number, number>,
  context: RecommendationContext
): ScoredRecommendation | null {
  const base = buildBaseRecommendation(deal, retailerDistanceMap, context);
  if (!base) return null;

  let score = base.score;

  const category = base.category.toLowerCase();
  const brand = (deal.products?.brand || '').toLowerCase();

  if (preferences.categories.has(category)) {
    score += 28;
  }

  if (brand && preferences.brands.has(brand)) {
    score += 14;
  }

  if (preferences.favouriteProductIds.has(base.product_id)) {
    score += 18;
  }

  return {
    ...base,
    reason: derivePersonalizedReason(base, preferences),
    score: roundScore(score),
  };
}

function scoreSmartDeal(
  deal: DealRecord,
  preferences: UserPreferenceProfile,
  retailerDistanceMap: Map<number, number>,
  context: RecommendationContext
): ScoredRecommendation | null {
  const base = buildBaseRecommendation(deal, retailerDistanceMap, context);
  if (!base) return null;

  let score = base.score;

  const category = base.category.toLowerCase();
  if (preferences.categories.has(category)) {
    score += 35;
  }

  if (base.discount_percentage >= 25) {
    score += 20;
  }

  return {
    ...base,
    reason: `Great savings in your usual category`,
    score: roundScore(score),
  };
}

function scoreTrendingDeal(
  deal: DealRecord,
  retailerDistanceMap: Map<number, number>,
  context: RecommendationContext
): ScoredRecommendation | null {
  const base = buildBaseRecommendation(deal, retailerDistanceMap, context);
  if (!base) return null;

  let score = base.score;

  if (base.discount_percentage >= 30) {
    score += 20;
  } else if (base.discount_percentage >= 20) {
    score += 10;
  }

  return {
    ...base,
    reason: 'Trending high-value deal',
    score: roundScore(score),
  };
}

function scoreSimilarDeal(
  deal: DealRecord,
  targetProduct: { category?: string | null; brand?: string | null },
  retailerDistanceMap: Map<number, number>,
  context: RecommendationContext
): ScoredRecommendation | null {
  const base = buildBaseRecommendation(deal, retailerDistanceMap, context);
  if (!base) return null;

  const targetCategory = (targetProduct.category || '').toLowerCase();
  const targetBrand = (targetProduct.brand || '').toLowerCase();
  const dealCategory = base.category.toLowerCase();
  const dealBrand = (deal.products?.brand || '').toLowerCase();

  let score = base.score;

  if (targetCategory && dealCategory === targetCategory) {
    score += 30;
  }

  if (targetBrand && dealBrand && targetBrand === dealBrand) {
    score += 12;
  }

  if (targetCategory && dealCategory !== targetCategory) {
    score -= 8;
  }

  return {
    ...base,
    reason: 'Similar product with strong discount',
    score: roundScore(score),
  };
}

function buildBaseRecommendation(
  deal: DealRecord,
  retailerDistanceMap: Map<number, number>,
  context: RecommendationContext
): ScoredRecommendation | null {
  const product = normalizeSingleRelation(deal.products);
  const retailer = normalizeSingleRelation(deal.retailers);

  if (!product || !retailer || !product.name) {
    return null;
  }

  const discountedPrice = Number(deal.deal_price || 0);
  if (!Number.isFinite(discountedPrice) || discountedPrice <= 0) {
    return null;
  }

  const originalPrice = Number(deal.original_price || discountedPrice);
  const computedDiscount =
    deal.discount && deal.discount > 0
      ? Number(deal.discount)
      : originalPrice > discountedPrice
      ? ((originalPrice - discountedPrice) / originalPrice) * 100
      : 0;

  let score = computedDiscount * 1.8;
  score += Math.min(25, Math.max(0, originalPrice - discountedPrice) * 0.35);

  const distanceKm = retailerDistanceMap.get(deal.retailer_id);
  if (distanceKm !== undefined) {
    const maxDistance = context.maxDistance ?? DEFAULT_MAX_DISTANCE;
    if (distanceKm <= maxDistance) {
      score += Math.max(0, 18 - distanceKm * 1.2);
    } else {
      score -= Math.min(20, (distanceKm - maxDistance) * 1.5);
    }
  }

  return {
    product_id: product.product_id,
    product_name: product.name,
    category: product.category || 'General',
    retailer: retailer.name,
    original_price: roundMoney(originalPrice),
    discounted_price: roundMoney(discountedPrice),
    discount_percentage: roundMoney(computedDiscount),
    supermarket_id: Number(deal.supermarket_id || deal.retailer_id),
    supermarket_name: retailer.name,
    distance: distanceKm !== undefined ? roundMoney(distanceKm) : undefined,
    reason: 'Recommended deal',
    score: roundScore(score),
    valid_from: deal.start_date,
    valid_to: deal.end_date,
  };
}

function derivePersonalizedReason(
  recommendation: Recommendation,
  preferences: UserPreferenceProfile
): string {
  const category = recommendation.category.toLowerCase();
  if (preferences.categories.has(category)) {
    return `Based on your ${recommendation.category} preferences`;
  }

  if (preferences.favouriteProductIds.has(recommendation.product_id)) {
    return 'One of your favourite products is on deal';
  }

  return 'Recommended for your shopping habits';
}

function normalizeSingleRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  if (Array.isArray(relation)) {
    return relation[0] || null;
  }
  return relation;
}

function calculateDistanceKm(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const R = 6371;
  const dLat = toRadians(endLat - startLat);
  const dLng = toRadians(endLng - startLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startLat)) *
      Math.cos(toRadians(endLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}
