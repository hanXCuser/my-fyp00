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
  View,
} from 'react-native';

import { useList } from '@/contexts/ListContext';
import { useFavourites } from '@/contexts/FavouritesContext';
import { fetchDealsGroupedByDateRange, fetchDealsByDateRange, GroupedDeals, DealWithProduct } from '@/utils/deals-grouping';
import DealCard from '@/components/DealCard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ProductComparisonModal from '@/components/ProductComparisonModal';

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 48,
    },
    heading: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 16,
      color: colors.text,
      paddingHorizontal: 16,
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
    listContent: {
      paddingBottom: 32,
    },
    groupContainer: {
      marginBottom: 24,
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    dateRange: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    dealCountText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    viewAllText: {
      fontSize: 14,
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    dealsScroll: {
      paddingLeft: 16,
      paddingRight: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    errorText: {
      position: 'absolute',
      bottom: 24,
      left: 16,
      right: 16,
      backgroundColor: colorScheme === 'dark' ? '#3b1f21' : '#fee2e2',
      padding: 12,
      borderRadius: 8,
      color: colors.danger,
      textAlign: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.danger,
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
    sortContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      gap: 8,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    sortButtonText: {
      marginLeft: 6,
      fontSize: 14,
      fontWeight: '600',
      color: colors.accentPrimary,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    filterButtonActive: {
      backgroundColor: colorScheme === 'dark' ? '#123228' : '#d1fae5',
      borderColor: colors.success,
    },
    filterButtonText: {
      marginLeft: 6,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
    },
    filterButtonTextActive: {
      color: colors.success,
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
    listModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    listModalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
    },
    listModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    listModalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    productPreview: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    productPreviewText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    listScrollView: {
      maxHeight: 400,
    },
    noListsContainer: {
      padding: 40,
      alignItems: 'center',
    },
    noListsText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 12,
      marginBottom: 8,
    },
    noListsSubtext: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    listOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    listOptionIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colorScheme === 'dark' ? '#1c2733' : '#eef2ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    listOptionInfo: {
      flex: 1,
    },
    listOptionName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    listOptionCount: {
      fontSize: 14,
      color: colors.textMuted,
    },
  });

export default function HomeScreen() {
  const [groupedDeals, setGroupedDeals] = useState<GroupedDeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedDeals | null>(null);
  const [allDealsInRange, setAllDealsInRange] = useState<DealWithProduct[]>([]);
  const [loadingAllDeals, setLoadingAllDeals] = useState(false);
  const [sortByPrice, setSortByPrice] = useState<'asc' | 'desc' | 'none'>('none');
  const [showDealsOnly, setShowDealsOnly] = useState(false);
  const [listSelectionVisible, setListSelectionVisible] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<any>(null);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [comparisonKeyword, setComparisonKeyword] = useState('');

  
  const { lists, addItemToList, removeFromList, isInList } = useList();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const colorSchemeRaw = useColorScheme();
  const colorScheme: 'light' | 'dark' = colorSchemeRaw === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDealsGroupedByDateRange(10);
      setGroupedDeals(data);
      console.log(`Loaded ${data.length} deal groups`);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDeals();
    setRefreshing(false);
  }, [fetchDeals]);

  const handleDealPress = (deal: DealWithProduct) => {
    // Use product name or title as keyword for comparison
    const keyword = deal.products?.name || deal.title || '';
    setComparisonKeyword(keyword);
    setComparisonModalVisible(true);
  };

  const handleAddToList = (deal: DealWithProduct) => {
    const product = {
      product_id: deal.product_id,
      name: deal.title || deal.products?.name || 'Unknown',
      brand: deal.products?.brand,
      category: deal.products?.category,
      image_url: deal.products?.image_url,
      deal: deal,
    } as any;
    
    setSelectedProductToAdd(product);
    setListSelectionVisible(true);
  };

  const handleSelectList = async (listId: number) => {
    if (selectedProductToAdd) {
      await addItemToList(listId, selectedProductToAdd);
      setListSelectionVisible(false);
      setSelectedProductToAdd(null);
    }
  };

  const handleToggleFavourite = (deal: DealWithProduct) => {
    const product_id = deal.product_id;

    if (isFavourite(product_id)) {
      removeFromFavourites(product_id);
    } else {
      const product = {
        product_id: product_id,
        name: deal.title || deal.products?.name || 'Unknown',
        brand: deal.products?.brand,
        category: deal.products?.category,
        image_url: deal.products?.image_url,
        deal: deal,
      } as any;
      addToFavourites(product);
    }
  };

  const handleViewAll = async (group: GroupedDeals) => {
    setSelectedGroup(group);
    setModalVisible(true);
    setLoadingAllDeals(true);
    setSortByPrice('none');
    setShowDealsOnly(false);

    try {
      const allDeals = await fetchDealsByDateRange(group.startDate, group.endDate);
      setAllDealsInRange(allDeals);
    } catch (err) {
      console.error('Error fetching all deals:', err);
    } finally {
      setLoadingAllDeals(false);
    }
  };

  const togglePriceSort = () => {
    if (sortByPrice === 'none' || sortByPrice === 'desc') {
      setSortByPrice('asc');
    } else {
      setSortByPrice('desc');
    }
  };

  const getSortedDeals = () => {
    let filtered = allDealsInRange;
    
    // Filter to show only items with discounts
    if (showDealsOnly) {
      filtered = filtered.filter(deal => {
        const hasDiscount = deal.discount && deal.discount > 0;
        const hasPriceDiff = deal.original_price && deal.original_price > deal.deal_price;
        return hasDiscount || hasPriceDiff;
      });
    }
    
    // Sort by price
    if (sortByPrice === 'none') {
      return filtered;
    }
    
    const sorted = [...filtered].sort((a, b) => {
      const priceA = a.deal_price;
      const priceB = b.deal_price;
      return sortByPrice === 'asc' ? priceA - priceB : priceB - priceA;
    });
    
    return sorted;
  };

  const renderDealGroup = ({ item: group }: { item: GroupedDeals }) => {
    return (
      <View style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <View>
            <Text style={styles.dateRange}>Valid: {group.dateRange}</Text>
            <Text style={styles.dealCountText}>{group.dealCount} deal{group.dealCount !== 1 ? 's' : ''}</Text>
          </View>
          <Pressable onPress={() => handleViewAll(group)}>
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dealsScroll}
        >
          {group.deals.map((deal) => (
            <DealCard
              key={deal.deal_id}
              deal={deal}
              onPress={() => handleDealPress(deal)}
              onAddToList={() => handleAddToList(deal)}
              onToggleFavourite={() => handleToggleFavourite(deal)}
              isInList={isInList(deal.product_id)}
              isFavourite={isFavourite(deal.product_id)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>🔥 Hot Deals</Text>
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
          <Text style={styles.loadingText}>Loading deals...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🔥 Hot Deals</Text>
      
      {groupedDeals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pricetag-outline" size={64} color={colors.icon} />
          <Text style={styles.emptyTitle}>No deals available</Text>
          <Text style={styles.emptySubtitle}>Check back later for amazing deals</Text>
        </View>
      ) : (
        <FlatList
          data={groupedDeals}
          keyExtractor={(item) => `${item.startDate}-${item.endDate}`}
          renderItem={renderDealGroup}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentPrimary} />
          }
        />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Modal for viewing all deals in a date range */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {selectedGroup?.dateRange}
              </Text>
              <Text style={styles.modalSubtitle}>
                {allDealsInRange.length} deals
              </Text>
            </View>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
              <Ionicons name="close-circle" size={32} color={colors.icon} />
            </Pressable>
          </View>

          {/* Sort Controls */}
          <View style={styles.sortContainer}>
            <Pressable style={styles.sortButton} onPress={togglePriceSort}>
              <Ionicons 
                name={sortByPrice === 'asc' ? 'arrow-up' : sortByPrice === 'desc' ? 'arrow-down' : 'swap-vertical'} 
                size={16} 
                color={colors.accentPrimary} 
              />
              <Text style={styles.sortButtonText}>
                {sortByPrice === 'asc' ? 'Price: Low to High' : sortByPrice === 'desc' ? 'Price: High to Low' : 'Sort by Price'}
              </Text>
            </Pressable>
            
            <Pressable 
              style={[styles.filterButton, showDealsOnly && styles.filterButtonActive]} 
              onPress={() => setShowDealsOnly(!showDealsOnly)}
            >
              <Ionicons 
                name={showDealsOnly ? 'pricetag' : 'pricetag-outline'} 
                size={16} 
                color={showDealsOnly ? colors.success : colors.icon} 
              />
              <Text style={[styles.filterButtonText, showDealsOnly && styles.filterButtonTextActive]}>
                Deals Only
              </Text>
            </Pressable>
          </View>

          {loadingAllDeals ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.accentPrimary} />
              <Text style={styles.loadingText}>Loading deals...</Text>
            </View>
          ) : (
            <FlatList
              data={getSortedDeals()}
              keyExtractor={(item) => item.deal_id.toString()}
              renderItem={({ item }) => (
                <View style={styles.modalDealCard}>
                  <DealCard
                    deal={item}
                    onPress={() => handleDealPress(item)}
                    onAddToList={() => handleAddToList(item)}
                    onToggleFavourite={() => handleToggleFavourite(item)}
                    isInList={isInList(item.product_id)}
                    isFavourite={isFavourite(item.product_id)}
                  />
                </View>
              )}
              numColumns={2}
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
        animationType="slide"
        onRequestClose={() => setListSelectionVisible(false)}
      >
        <View style={styles.listModalOverlay}>
          <View style={styles.listModalContent}>
            <View style={styles.listModalHeader}>
              <Text style={styles.listModalTitle}>Add to List</Text>
              <Pressable onPress={() => setListSelectionVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </Pressable>
            </View>
            
            {selectedProductToAdd && (
              <View style={styles.productPreview}>
                <Text style={styles.productPreviewText} numberOfLines={1}>
                  {selectedProductToAdd.name}
                </Text>
              </View>
            )}

            <ScrollView style={styles.listScrollView}>
              {lists.length === 0 ? (
                <View style={styles.noListsContainer}>
                  <Ionicons name="list-outline" size={48} color={colors.icon} />
                  <Text style={styles.noListsText}>No lists yet</Text>
                  <Text style={styles.noListsSubtext}>
                    Go to the My List tab to create your first list
                  </Text>
                </View>
              ) : (
                lists.map((list) => (
                  <Pressable
                    key={list.list_id}
                    style={styles.listOption}
                    onPress={() => handleSelectList(list.list_id)}
                  >
                    <View style={styles.listOptionIcon}>
                      <Ionicons name="list" size={24} color={colors.accentPrimary} />
                    </View>
                    <View style={styles.listOptionInfo}>
                      <Text style={styles.listOptionName}>{list.list_name}</Text>
                      <Text style={styles.listOptionCount}>
                        {list.item_count || 0} {list.item_count === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ProductComparisonModal
        visible={comparisonModalVisible}
        onClose={() => setComparisonModalVisible(false)}
        keyword={comparisonKeyword}
      />
    </View>
  );
}
