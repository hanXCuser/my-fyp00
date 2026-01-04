import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { supabase } from '@/lib/supabase';
import { useList } from '@/contexts/ListContext';
import { useFavourites } from '@/contexts/FavouritesContext';

type Deal = {
  deal_id: number;
  product_id: number;
  supermarket_id?: number;
  retailer_id: number;
  pamphlet_id?: number;
  title: string;
  description?: string;
  deal_price: number;
  original_price?: number;
  discount?: number;
  start_date: string;
  end_date: string;
  source: string;
  created_at?: string;
};

type Supermarket = {
  supermarket_id: number;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
};

type Product = {
  product_id: number;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  description?: string;
  base_price?: number; // Regular base price
  deal?: Deal | null; // Active deal for this product
  retailer?: { retailer_id: number; name: string } | null;
  supermarket?: Supermarket | null; // Supermarket location for map
};

// Product card component to handle image loading
function ProductCard({ 
  item, 
  onPress, 
  onAddToList, 
  onToggleFavourite,
  isInList,
  isFavourite 
}: {
  item: Product;
  onPress: () => void;
  onAddToList: () => void;
  onToggleFavourite: () => void;
  isInList: boolean;
  isFavourite: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const hasDeal = Boolean(item.deal);

  // Simple placeholder with product initial
  const getPlaceholder = () => {
    const initial = item.name.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&size=400&background=e5e7eb&color=6b7280&bold=true`;
  };
  
  const placeholderUri = getPlaceholder();
  
  // Check if we have a valid URL
  const hasValidUrl = item.image_url && item.image_url.trim().length > 0;
  
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {!hasValidUrl || imageError ? (
        <View style={[styles.cardImage, styles.placeholderContainer]}>
          <Text style={styles.placeholderText}>{item.name.substring(0, 2).toUpperCase()}</Text>
        </View>
      ) : (
        <Image 
          source={{ uri: item.image_url }}
          style={styles.cardImage} 
          contentFit="cover"
          transition={200}
          cachePolicy="none"
          onError={(error) => {
            console.log(`❌ Image failed: ${item.name}`);
            setImageError(true);
          }}
        />
      )}
      <View style={styles.cardContent}>
        {item.retailer && item.retailer.name && (
          <View style={styles.retailerBadge}>
            <Text style={styles.retailerBadgeText} numberOfLines={1} ellipsizeMode="tail">
              {item.retailer.name}
            </Text>
          </View>
        )}
        {item.supermarket && (
          <View style={styles.locationBadge}>
            <Ionicons name="location-outline" size={12} color="#059669" />
            <Text style={styles.locationBadgeText}>
              {item.supermarket.location || item.supermarket.name}
            </Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
          {item.brand && (
            <Text style={styles.brandText}>{item.brand}</Text>
          )}
        </View>
        {hasDeal ? (
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>Rs {item.deal!.deal_price.toFixed(2)}</Text>
              {item.deal!.discount && item.deal!.discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discount}>-{item.deal!.discount}%</Text>
                </View>
              )}
            </View>
            {item.deal!.original_price && item.deal!.original_price > item.deal!.deal_price && (
              <Text style={styles.originalPrice}>Rs {item.deal!.original_price.toFixed(2)}</Text>
            )}
          </View>
        ) : item.base_price ? (
          <View style={styles.priceContainer}>
            <Text style={styles.price}>Rs {item.base_price.toFixed(2)}</Text>
          </View>
        ) : (
          <Text style={styles.noDealText}>Price unavailable</Text>
        )}
        <View style={styles.cardActions}>
          <Pressable
            style={[styles.actionButton, isInList && styles.actionButtonActive]}
            onPress={(e) => {
              e.stopPropagation();
              onAddToList();
            }}>
            <Text style={[styles.actionButtonText, isInList && styles.actionButtonTextActive]}>
              {isInList ? 'Added' : 'Add to list'}
            </Text>
          </Pressable>
          <Pressable onPress={(e) => {
            e.stopPropagation();
            onToggleFavourite();
          }} hitSlop={10}>
            <Ionicons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavourite ? '#ff3366' : '#222'}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dealFilter, setDealFilter] = useState<'all' | 'deals'>('all');
  const { addToList, removeFromList, isInList } = useList();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch products with their active deals (where end_date >= today)
      const today = new Date().toISOString().split('T')[0];
      
      const { data: productsData, error: fetchError } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          brand,
          category,
          unit,
          image_url,
          description,
          base_price
        `);

      if (fetchError) {
        console.error('Error fetching products:', fetchError);
        throw fetchError;
      }

      if (productsData && productsData.length > 0) {
        console.log(`✓ Fetched ${productsData.length} products from database`);
        
        // Log first 3 products with image info
        console.log('First 3 products:');
        productsData.slice(0, 3).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name}`);
          console.log(`     Image: ${p.image_url ? 'Has URL' : 'NO URL'}`);
          if (p.image_url) {
            console.log(`     URL: ${p.image_url.substring(0, 60)}...`);
          }
        });
        
        // Fetch all active deals with retailer and supermarket location info
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select(`
            *,
            retailers!inner (
              retailer_id,
              name
            )
          `)
          .gte('end_date', today);
        
        // Fetch ALL deal-supermarket links (including expired deals) to get location data for all products
        const { data: allDealLocationsData } = await supabase
          .from('deal_supermarket')
          .select(`
            deal_id,
            supermarkets!inner (
              supermarket_id,
              name,
              location,
              latitude,
              longitude
            )
          `);
        
        // Create a map of product_id to supermarket for quick lookup
        const productSupermarketMap = new Map();
        
        // First pass: get all deals (active and expired) to map products to supermarkets
        const { data: allDealsData } = await supabase
          .from('deals')
          .select(`
            deal_id, 
            product_id, 
            retailer_id,
            retailers!inner (
              retailer_id,
              name
            )
          `);
        
        if (allDealsData && allDealLocationsData) {
          allDealsData.forEach((deal: any) => {
            if (!productSupermarketMap.has(deal.product_id)) {
              const dealLocation = allDealLocationsData.find((dl: any) => dl.deal_id === deal.deal_id);
              if (dealLocation) {
                productSupermarketMap.set(deal.product_id, (dealLocation as any).supermarkets);
              }
            }
          });
        }
        
        // Create a map of product_id to retailer
        const productRetailerMap = new Map();
        if (allDealsData) {
          allDealsData.forEach((deal: any) => {
            if (!productRetailerMap.has(deal.product_id) && deal.retailers) {
              productRetailerMap.set(deal.product_id, deal.retailers);
            }
          });
        }
        
        // Fetch all supermarkets for products without deals
        const { data: allSupermarkets } = await supabase
          .from('supermarkets')
          .select('supermarket_id, retailer_id, name, location, latitude, longitude');
        
        // Create a map of retailer_id to supermarkets
        const retailerSupermarketMap = new Map();
        if (allSupermarkets) {
          allSupermarkets.forEach((sm: any) => {
            if (!retailerSupermarketMap.has(sm.retailer_id)) {
              retailerSupermarketMap.set(sm.retailer_id, sm);
            }
          });
        }

        if (dealsError) {
          console.error('Error fetching deals:', dealsError);
        } else {
          console.log(`✓ Fetched ${dealsData?.length || 0} active deals`);
        }

        // Map products with their deals, retailer, and supermarket info
        const productsWithDeals = productsData.map((product) => {
          const deal = dealsData?.find((d) => d.product_id === product.product_id);
          
          // Get retailer from any deal (active or expired)
          const retailer = deal ? (deal as any).retailers : (productRetailerMap.get(product.product_id) || null);
          
          // Get supermarket from map (works for all products that have been in deals)
          let supermarket = productSupermarketMap.get(product.product_id) || null;
          
          // If no supermarket from deals, try to get one from retailer
          if (!supermarket) {
            // Try to find retailer from any deal (active or expired)
            const anyDeal = allDealsData?.find((d: any) => d.product_id === product.product_id);
            if (anyDeal && anyDeal.retailer_id) {
              supermarket = retailerSupermarketMap.get(anyDeal.retailer_id) || null;
            }
            // If still no supermarket, assign first available supermarket
            if (!supermarket && allSupermarkets && allSupermarkets.length > 0) {
              supermarket = allSupermarkets[0];
            }
          }
          
          return { 
            ...product, 
            deal: deal || null,
            retailer: retailer,
            supermarket: supermarket
          };
        });

        setProducts(productsWithDeals);
        setError(null);
      } else {
        console.warn('No products found in database');
        setProducts([]);
      }
    } catch (fetchErr) {
      console.error('Failed to fetch products:', fetchErr);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((product) => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.brand?.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by deal status
    if (dealFilter === 'deals') {
      filtered = filtered.filter((product) => product.deal !== null);
    }

    return filtered;
  }, [products, searchQuery, dealFilter]);

  const toggleFavourite = useCallback((product: Product) => {
    if (isFavourite(product.product_id)) {
      removeFromFavourites(product.product_id);
    } else {
      addToFavourites(product);
    }
  }, [isFavourite, addToFavourites, removeFromFavourites]);

  const handleProductPress = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const renderProduct = ({ item }: { item: Product }) => {
    return (
      <ProductCard
        item={item}
        onPress={() => handleProductPress(item)}
        onAddToList={() => {
          if (isInList(item.product_id)) {
            removeFromList(item.product_id);
          } else {
            addToList(item);
          }
        }}
        onToggleFavourite={() => toggleFavourite(item)}
        isInList={isInList(item.product_id)}
        isFavourite={isFavourite(item.product_id)}
      />
    );
  };

  // Sorting state: none | price-asc | price-desc | alpha-asc | alpha-desc
  const [sortOption, setSortOption] = useState<'none' | 'price-asc' | 'price-desc' | 'alpha-asc' | 'alpha-desc'>('none');
  const [filterVisible, setFilterVisible] = useState(false);

  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts];
    switch (sortOption) {
      case 'price-asc':
        return items.sort((a, b) => {
          const pa = a.deal?.deal_price ?? Infinity;
          const pb = b.deal?.deal_price ?? Infinity;
          return pa - pb;
        });
      case 'price-desc':
        return items.sort((a, b) => {
          const pa = a.deal?.deal_price ?? -Infinity;
          const pb = b.deal?.deal_price ?? -Infinity;
          return pb - pa;
        });
      case 'alpha-asc':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case 'alpha-desc':
        return items.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return items;
    }
  }, [filteredProducts, sortOption]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Discover Products</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a product..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Pressable style={styles.filterButton} onPress={() => setFilterVisible(true)} hitSlop={8}>
          <Ionicons name="filter" size={20} color="#111" />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsContainer}>
        <Pressable 
          style={[styles.filterChip, dealFilter === 'all' && styles.filterChipActive]}
          onPress={() => setDealFilter('all')}>
          <Text style={[styles.filterChipText, dealFilter === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.filterChip, dealFilter === 'deals' && styles.filterChipActive]}
          onPress={() => setDealFilter('deals')}>
          <Text style={[styles.filterChipText, dealFilter === 'deals' && styles.filterChipTextActive]}>
            With Deals
          </Text>
        </Pressable>
      </ScrollView>

      {isLoading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#222" />
        </View>
      ) : (
        <>
          <FlatList
            key="grid-2-columns"
            data={sortedProducts}
            keyExtractor={(item) => item.product_id.toString()}
            renderItem={renderProduct}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{searchQuery ? 'No matches' : 'No products yet'}</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try a different search term.' : 'Pull to refresh or add products to your database.'}
                </Text>
              </View>
            }
          />

          {/* Filter Modal */}
          <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
            <Pressable style={styles.filterModalOverlay} onPress={() => setFilterVisible(false)}>
              <View style={styles.filterModalContainer}>
                <Text style={styles.filterModalTitle}>Sort by</Text>
                <Pressable
                  style={[styles.filterOption, sortOption === 'none' && styles.filterOptionActive]}
                  onPress={() => { setSortOption('none'); setFilterVisible(false); }}>
                  <Text style={[styles.filterOptionText, sortOption === 'none' && styles.filterOptionTextActive]}>None</Text>
                </Pressable>
                <Pressable
                  style={[styles.filterOption, sortOption === 'price-asc' && styles.filterOptionActive]}
                  onPress={() => { setSortOption('price-asc'); setFilterVisible(false); }}>
                  <Text style={[styles.filterOptionText, sortOption === 'price-asc' && styles.filterOptionTextActive]}>Price: Low → High</Text>
                </Pressable>
                <Pressable
                  style={[styles.filterOption, sortOption === 'price-desc' && styles.filterOptionActive]}
                  onPress={() => { setSortOption('price-desc'); setFilterVisible(false); }}>
                  <Text style={[styles.filterOptionText, sortOption === 'price-desc' && styles.filterOptionTextActive]}>Price: High → Low</Text>
                </Pressable>
                <Pressable
                  style={[styles.filterOption, sortOption === 'alpha-asc' && styles.filterOptionActive]}
                  onPress={() => { setSortOption('alpha-asc'); setFilterVisible(false); }}>
                  <Text style={[styles.filterOptionText, sortOption === 'alpha-asc' && styles.filterOptionTextActive]}>A → Z</Text>
                </Pressable>
                <Pressable
                  style={[styles.filterOption, sortOption === 'alpha-desc' && styles.filterOptionActive]}
                  onPress={() => { setSortOption('alpha-desc'); setFilterVisible(false); }}>
                  <Text style={[styles.filterOptionText, sortOption === 'alpha-desc' && styles.filterOptionTextActive]}>Z → A</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Product Detail Modal */}
      <Modal
        visible={selectedProduct !== null}
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Pressable style={styles.closeButton} onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={28} color="#111" />
              </Pressable>
              
              <Image
                source={selectedProduct.image_url || 'https://via.placeholder.com/600x600/EEEEEE/999999?text=No+Image'}
                style={styles.detailImage}
                contentFit="contain"
                transition={300}
                placeholder="https://via.placeholder.com/600x600/EEEEEE/999999?text=Loading"
                cachePolicy="memory-disk"
                priority="high"
                recyclingKey={selectedProduct.product_id.toString()}
                onError={(error) => console.log('Detail image error:', error)}
              />
              
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>{selectedProduct.name}</Text>
                
                {selectedProduct.brand && (
                  <Text style={styles.detailBrand}>{selectedProduct.brand}</Text>
                )}
                
                {selectedProduct.category && (
                  <Text style={styles.detailCategory}>Category: {selectedProduct.category}</Text>
                )}
                
                {selectedProduct.description && (
                  <Text style={styles.detailDescription}>{selectedProduct.description}</Text>
                )}
                
                {selectedProduct.deal ? (
                  <>
                    <View style={styles.dealSection}>
                      <Text style={styles.dealSectionTitle}>🔥 Active Deal</Text>
                      <Text style={styles.dealTitle}>{selectedProduct.deal.title}</Text>
                      {selectedProduct.deal.description && (
                        <Text style={styles.dealDescription}>{selectedProduct.deal.description}</Text>
                      )}
                      <View style={styles.detailPriceRow}>
                        <Text style={styles.detailPrice}>${selectedProduct.deal.deal_price.toFixed(2)}</Text>
                        <Text style={styles.detailDiscount}>-{selectedProduct.deal.discount}%</Text>
                      </View>
                      <Text style={styles.dealDates}>
                        Valid: {new Date(selectedProduct.deal.start_date).toLocaleDateString()} - {new Date(selectedProduct.deal.end_date).toLocaleDateString()}
                      </Text>
                      {selectedProduct.deal.source && (
                        <Text style={styles.dealSource}>Source: {selectedProduct.deal.source}</Text>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.noDealSection}>
                    <Text style={styles.noDealText}>No active deals for this product</Text>
                  </View>
                )}
                
                <View style={styles.detailActions}>
                  <Pressable
                    style={[
                      styles.detailActionButton,
                      isInList(selectedProduct.product_id) && styles.detailActionButtonActive,
                    ]}
                    onPress={() => {
                      if (isInList(selectedProduct.product_id)) {
                        removeFromList(selectedProduct.product_id);
                      } else {
                        addToList(selectedProduct);
                      }
                    }}>
                    <Text style={styles.detailActionButtonText}>
                      {isInList(selectedProduct.product_id) ? 'Remove from list' : 'Add to list'}
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    style={[
                      styles.detailFavButton,
                      isFavourite(selectedProduct.product_id) && styles.detailFavButtonActive,
                    ]}
                    onPress={() => toggleFavourite(selectedProduct)}>
                    <Ionicons
                      name={isFavourite(selectedProduct.product_id) ? 'heart' : 'heart-outline'}
                      size={24}
                      color={isFavourite(selectedProduct.product_id) ? '#fff' : '#111'}
                    />
                    <Text
                      style={[
                        styles.detailFavButtonText,
                        isFavourite(selectedProduct.product_id) && styles.detailFavButtonTextActive,
                      ]}>
                      {isFavourite(selectedProduct.product_id) ? 'Saved' : 'Save to favorites'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    backgroundColor: '#f8f9fb',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111',
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e6ec',
    marginBottom: 16,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#edf0f5',
    flex: 1,
    marginHorizontal: 4,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  placeholderContainer: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#9ca3af',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  noDealText: {
    fontSize: 11,
    color: '#9aa0a6',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  recommendedBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    color: '#1976d2',
    fontSize: 10,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  discount: {
    color: '#ff3366',
    fontWeight: '600',
    fontSize: 11,
  },
  originalPrice: {
    color: '#9aa0a6',
    textDecorationLine: 'line-through',
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  actionButtonActive: {
    backgroundColor: '#0d9488',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtonTextActive: {
    color: '#e0f2f1',
  },
  emptyState: {
    marginTop: 64,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: '#b91c1c',
    marginTop: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    paddingBottom: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  detailImage: {
    width: '100%',
    height: 450,
    backgroundColor: '#e9eef5',
    borderRadius: 12,
  },
  detailContent: {
    padding: 24,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  detailBrand: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  detailCategory: {
    fontSize: 14,
    color: '#9aa0a6',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  dealSection: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#ffb74d',
  },
  dealSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e65100',
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  dealDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  dealDates: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  dealSource: {
    fontSize: 11,
    color: '#9aa0a6',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noDealSection: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  detailRecommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  detailRecommendedText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  detailPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
  },
  detailDiscount: {
    marginLeft: 12,
    color: '#ff3366',
    fontWeight: '700',
    fontSize: 18,
  },
  detailOriginalPrice: {
    marginLeft: 12,
    color: '#9aa0a6',
    textDecorationLine: 'line-through',
    fontSize: 18,
  },
  detailActions: {
    gap: 12,
  },
  detailActionButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailActionButtonActive: {
    backgroundColor: '#0d9488',
  },
  detailActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  detailFavButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  detailFavButtonActive: {
    backgroundColor: '#ff3366',
  },
  detailFavButtonText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 16,
  },
  detailFavButtonTextActive: {
    color: '#fff',
  },
  // Filter & search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    width: 44,
    height: 44,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e6ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  filterModalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#111',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#111',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  // Retailer badge
  retailerBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
    width: '40%',
  },
  retailerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4b5563',
  },
  // Location badge
  locationBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  // Filter chips
  filterChipsContainer: {
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  filterChipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  // Price display
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: '#fee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
});
