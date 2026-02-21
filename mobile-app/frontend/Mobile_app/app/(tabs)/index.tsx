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

import { useList } from '@/contexts/ListContext';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  fetchCheapestProducts, 
  fetchDealsByRetailer, 
  fetchDealsByDateRange,
  fetchCategories,
  CheapestProduct, 
  RetailerDeals,
  DealWithProduct
} from '@/utils/deals-grouping';
import DealCard from '@/components/DealCard';
import ProductComparisonModal from '@/components/ProductComparisonModal';
import { Colors } from '@/constants/theme';

export default function HomeScreen() {
  const [cheapestProducts, setCheapestProducts] = useState<CheapestProduct[]>([]);
  const [retailerDeals, setRetailerDeals] = useState<RetailerDeals[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerDeals | null>(null);
  const [retailerDealsData, setRetailerDealsData] = useState<DealWithProduct[]>([]);
  const [loadingRetailerDeals, setLoadingRetailerDeals] = useState(false);
  const [listSelectionVisible, setListSelectionVisible] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<any>(null);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  const { lists, addItemToList, removeFromList, isInList } = useList();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);

    try {
      const [cheapest, retailers] = await Promise.all([
        fetchCheapestProducts(20, selectedCategory),
        fetchDealsByRetailer()
      ]);
      
      setCheapestProducts(cheapest);
      setRetailerDeals(retailers);
      console.log(`Loaded ${cheapest.length} cheapest products and ${retailers.length} retailer deals`);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDeals();
    setRefreshing(false);
  }, [fetchDeals]);

  const handleRetailerDealPress = async (retailer: RetailerDeals) => {
    setSelectedRetailer(retailer);
    setLoadingRetailerDeals(true);
    setModalVisible(true);

    try {
      const deals = await fetchDealsByDateRange(retailer.start_date, retailer.end_date);
      const filteredDeals = deals.filter(d => d.retailer_id === retailer.retailer_id);
      setRetailerDealsData(filteredDeals);
    } catch (err) {
      console.error('Error fetching retailer deals:', err);
    } finally {
      setLoadingRetailerDeals(false);
    }
  };

  const handleProductPress = (product: CheapestProduct) => {
    console.log('Product pressed:', product.name);
    setSelectedProductId(product.product_id);
    setComparisonModalVisible(true);
  };

  const handleDealPress = (deal: DealWithProduct) => {
    console.log('Deal pressed:', deal.products?.name || deal.title);
  };

  const handleAddToList = (item: any) => {
    setSelectedProductToAdd(item);
    setListSelectionVisible(true);
  };

  const handleSelectList = (listId: number) => {
    if (selectedProductToAdd?.deal) {
      addItemToList(listId, selectedProductToAdd.deal.deal_id);
    } else if (selectedProductToAdd?.deal_id) {
      addItemToList(listId, selectedProductToAdd.deal_id);
    }
    setListSelectionVisible(false);
    setSelectedProductToAdd(null);
  };

  const handleToggleFavourite = (item: any) => {
    const dealId = item?.deal?.deal_id || item?.deal_id;
    if (!dealId) return;

    if (isFavourite(dealId)) {
      removeFromFavourites(dealId);
    } else {
      addToFavourites(dealId);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return cheapestProducts;

    const query = searchQuery.toLowerCase();
    return cheapestProducts.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    );
  }, [cheapestProducts, searchQuery]);

  if (isLoading) {
    return (
      <View style={styles.loaderWrapper}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading deals...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>Your Location</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.locationText}>Port Louis, MU</Text>
          </View>
        </View>
        <Pressable style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.mainTitle}>Find the Best{'\n'}Deals Today</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, brands..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <Pressable
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Cheapest Products Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cheapest Today 🔥</Text>
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <Pressable
              key={product.product_id}
              style={styles.productCard}
              onPress={() => handleProductPress(product)}
            >
              {product.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  style={styles.productImage}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.placeholderText}>
                    {product.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <Pressable 
                style={styles.favoriteButton}
                onPress={() => handleToggleFavourite({ deal_id: product.deal_id })}
              >
                <Ionicons
                  name={isFavourite(product.deal_id) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavourite(product.deal_id) ? '#ef4444' : colors.textSecondary}
                />
              </Pressable>

              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                {product.category && (
                  <Text style={styles.productCategory}>{product.category}</Text>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>Rs {product.cheapest_price.toFixed(0)}</Text>
                  {product.savings && product.savings > 0 && (
                    <View style={styles.savingsLabel}>
                      <Text style={styles.savingsText}>
                        Save Rs {product.savings.toFixed(0)}
                      </Text>
                    </View>
                  )}
                </View>
                {product.original_price && (
                  <Text style={styles.originalPrice}>
                    Rs {product.original_price.toFixed(0)}
                  </Text>
                )}
                <View style={styles.storeRow}>
                  <View style={styles.storeBadge}>
                    <Text style={styles.storeName} numberOfLines={1}>
                      {product.store_name}
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable 
                style={styles.addButton}
                onPress={() => handleAddToList({ deal_id: product.deal_id })}
              >
                <Ionicons name="add-circle" size={32} color={colors.primary} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      {/* Weekly Deals Section */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Weekly Deals</Text>
      </View>

      {retailerDeals.map((retailer) => (
        <Pressable
          key={`${retailer.retailer_id}-${retailer.start_date}`}
          style={styles.dealCard}
          onPress={() => handleRetailerDealPress(retailer)}
        >
          <View style={styles.dealCardContent}>
            <View style={styles.dealInfo}>
              <Text style={styles.dealTitle}>{retailer.deal_title}</Text>
              <Text style={styles.dealSubtitle}>{retailer.retailer_name}</Text>
              <Text style={styles.dealValidity}>Valid: {retailer.dateRange}</Text>
              <Text style={styles.dealCount}>{retailer.deal_count} products</Text>
            </View>
            <View style={styles.dealIcon}>
              <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </View>
          </View>
        </Pressable>
      ))}

      {/* Retailer Deals Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedRetailer?.deal_title}</Text>
              <Text style={styles.modalSubtitle}>{selectedRetailer?.retailer_name}</Text>
            </View>
            <Pressable onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>

          {loadingRetailerDeals ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={retailerDealsData}
              keyExtractor={(item) => item.deal_id.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <View style={styles.modalDealCard}>
                  <DealCard
                    deal={item}
                    onPress={() => handleDealPress(item)}
                    onToggleFavourite={() => handleToggleFavourite({ deal: item })}
                    onAddToList={() => handleAddToList({ deal: item })}
                  />
                </View>
              )}
              contentContainerStyle={styles.modalContent}
              columnWrapperStyle={styles.modalRow}
            />
          )}
        </View>
      </Modal>

      {/* List Selection Modal */}
      <Modal
        visible={listSelectionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setListSelectionVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setListSelectionVisible(false)}
        >
          <View style={styles.listModal}>
            <Text style={styles.listModalTitle}>Add to List</Text>
            <ScrollView style={styles.listScrollView}>
              {lists.map((list) => (
                <Pressable
                  key={list.list_id}
                  style={styles.listItem}
                  onPress={() => handleSelectList(list.list_id)}
                >
                  <Text style={styles.listItemText}>{list.list_name}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Product Comparison Modal */}
      {selectedProductId && (
        <ProductComparisonModal
          visible={comparisonModalVisible}
          productId={selectedProductId}
          onClose={() => {
            setComparisonModalVisible(false);
            setSelectedProductId(null);
          }}
          onAddToList={(deal) => {
            setSelectedProductToAdd({ deal });
            setListSelectionVisible(true);
          }}
          onToggleFavourite={(deal) => handleToggleFavourite({ deal })}
        />
      )}
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 100,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    locationContainer: {
      marginBottom: 24,
    },
    locationLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 2,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    notificationButton: {
      position: 'absolute',
      right: 20,
      top: 50,
    },
    mainTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#fff',
      lineHeight: 36,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 20,
      marginTop: -50,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    categoriesContainer: {
      marginBottom: 16,
    },
    categoriesContent: {
      paddingHorizontal: 20,
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    categoryTextActive: {
      color: '#fff',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textMuted,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 8,
    },
    productCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    productImage: {
      width: '100%',
      height: 120,
      borderRadius: 12,
      marginBottom: 8,
    },
    productImagePlaceholder: {
      width: '100%',
      height: 120,
      borderRadius: 12,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    placeholderText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.placeholder,
    },
    favoriteButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      backgroundColor: colors.cardBackground,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
      minHeight: 36,
    },
    productCategory: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 6,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    productPrice: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    originalPrice: {
      fontSize: 11,
      color: colors.textMuted,
    },
    savingsLabel: {
      backgroundColor: colors.success,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    savingsText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
    },
    storeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    storeBadge: {
      backgroundColor: colorScheme === 'dark' ? colors.surface : colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      maxWidth: '100%',
    },
    storeName: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    addButton: {
      position: 'absolute',
      bottom: 12,
      right: 12,
    },
    dealCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    dealCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dealInfo: {
      flex: 1,
    },
    dealTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    dealSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 4,
    },
    dealValidity: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    dealCount: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    dealIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colorScheme === 'dark' ? colors.surface : colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textMuted,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
    },
    modalLoading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      padding: 16,
      paddingBottom: 32,
    },
    modalRow: {
      justifyContent: 'space-between',
    },
    modalDealCard: {
      width: '48%',
      marginBottom: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    listModal: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
      padding: 20,
    },
    listModalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    listScrollView: {
      maxHeight: 400,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    listItemText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  });
