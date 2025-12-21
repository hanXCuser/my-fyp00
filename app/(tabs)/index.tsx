import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { useList } from '@/contexts/ListContext';
import { useFavourites } from '@/contexts/FavouritesContext';

type Deal = {
  deal_id: string;
  product_id: string;
  supermarket_id: string;
  retailer_id: string;
  pamphlet_id: string;
  title: string;
  description: string;
  deal_price: number;
  discount: number;
  start_date: string;
  end_date: string;
  source: string;
  created_at: string;
};

type Product = {
  product_id: string;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image?: string;
  description?: string;
  deal?: Deal | null; // Active deal for this product
};

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addToList, removeFromList, isInList } = useList();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Mock data for testing UI
    const mockProducts: Product[] = [
      {
        product_id: '1',
        name: 'Winter Jacket',
        brand: 'North Face',
        category: 'Clothing',
        unit: 'piece',
        image: 'https://picsum.photos/seed/jacket/400',
        description: 'Warm winter jacket perfect for cold weather',
        deal: {
          deal_id: 'd1',
          product_id: '1',
          supermarket_id: 's1',
          retailer_id: 'r1',
          pamphlet_id: 'p1',
          title: 'Winter Sale',
          description: '15% off all winter clothing',
          deal_price: 102,
          discount: 15,
          start_date: '2025-12-01',
          end_date: '2025-12-31',
          source: 'Store Flyer',
          created_at: '2025-12-01',
        },
      },
      {
        product_id: '2',
        name: 'Running Shoes',
        brand: 'Nike',
        category: 'Footwear',
        unit: 'pair',
        image: 'https://picsum.photos/seed/shoes/400',
        description: 'Comfortable running shoes for daily exercise',
        deal: null,
      },
      {
        product_id: '3',
        name: 'Leather Backpack',
        brand: 'Samsonite',
        category: 'Accessories',
        unit: 'piece',
        image: 'https://picsum.photos/seed/backpack/400',
        description: 'Durable leather backpack with multiple compartments',
        deal: {
          deal_id: 'd2',
          product_id: '3',
          supermarket_id: 's1',
          retailer_id: 'r1',
          pamphlet_id: 'p1',
          title: 'Back to School',
          description: '20% off all bags',
          deal_price: 76,
          discount: 20,
          start_date: '2025-12-01',
          end_date: '2025-12-31',
          source: 'Online Ad',
          created_at: '2025-12-01',
        },
      },
    ];

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
          image,
          description
        `);

      if (fetchError) throw fetchError;

      if (productsData && productsData.length > 0) {
        // Fetch all active deals
        const { data: dealsData } = await supabase
          .from('deals')
          .select('*')
          .gte('end_date', today);

        // Map products with their deals
        const productsWithDeals = productsData.map((product) => {
          const deal = dealsData?.find((d) => d.product_id === product.product_id);
          return { ...product, deal: deal || null };
        });

        setProducts(productsWithDeals);
      } else {
        setProducts(mockProducts);
      }
    } catch (fetchErr) {
      console.error(fetchErr);
      setProducts(mockProducts);
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
    if (!searchQuery.trim()) {
      return products;
    }

    const lowerQuery = searchQuery.trim().toLowerCase();
    return products.filter((product) => product.name.toLowerCase().includes(lowerQuery));
  }, [products, searchQuery]);

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
    const hasDeal = Boolean(item.deal);
    const displayPrice = hasDeal ? item.deal!.deal_price : 0;
    const isProductFavourite = isFavourite(item.product_id);
    const itemInList = isInList(item.product_id);

    return (
      <Pressable style={styles.card} onPress={() => handleProductPress(item)}>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/400' }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
            {item.brand && (
              <Text style={styles.brandText}>{item.brand}</Text>
            )}
          </View>
          {hasDeal && (
            <View style={styles.priceRow}>
              <Text style={styles.price}>${displayPrice.toFixed(2)}</Text>
              <Text style={styles.discount}>-{item.deal!.discount}%</Text>
            </View>
          )}
          {!hasDeal && (
            <Text style={styles.noDealText}>No deals available</Text>
          )}
          <View style={styles.cardActions}>
            <Pressable
              style={[styles.actionButton, itemInList && styles.actionButtonActive]}
              onPress={(e) => {
                e.stopPropagation();
                if (itemInList) {
                  removeFromList(item.product_id);
                } else {
                  addToList(item);
                }
              }}>
              <Text style={[styles.actionButtonText, itemInList && styles.actionButtonTextActive]}>
                {itemInList ? 'Added' : 'Add to list'}
              </Text>
            </Pressable>
            <Pressable onPress={(e) => {
              e.stopPropagation();
              toggleFavourite(item);
            }} hitSlop={10}>
              <Ionicons
                name={isProductFavourite ? 'heart' : 'heart-outline'}
                size={20}
                color={isProductFavourite ? '#ff3366' : '#222'}
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
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

      {isLoading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#222" />
        </View>
      ) : (
        <>
          <FlatList
            key="grid-2-columns"
            data={sortedProducts}
            keyExtractor={(item) => item.product_id}
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
                source={{ uri: selectedProduct.image || 'https://via.placeholder.com/400' }}
                style={styles.detailImage}
                resizeMode="cover"
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
    height: 140,
    backgroundColor: '#e9eef5',
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
    height: 400,
    backgroundColor: '#e9eef5',
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
});
