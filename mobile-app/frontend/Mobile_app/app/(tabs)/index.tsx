import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
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
  
  const { lists, addItemToList, removeFromList, isInList } = useList();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();

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
    console.log('Deal pressed:', deal.title || deal.products?.name);
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
          <ActivityIndicator size="large" color="#3b82f6" />
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
          <Ionicons name="pricetag-outline" size={64} color="#ccc" />
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
              <Ionicons name="close-circle" size={32} color="#6b7280" />
            </Pressable>
          </View>

          {/* Sort Controls */}
          <View style={styles.sortContainer}>
            <Pressable style={styles.sortButton} onPress={togglePriceSort}>
              <Ionicons 
                name={sortByPrice === 'asc' ? 'arrow-up' : sortByPrice === 'desc' ? 'arrow-down' : 'swap-vertical'} 
                size={16} 
                color="#3b82f6" 
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
                color={showDealsOnly ? '#10b981' : '#6b7280'} 
              />
              <Text style={[styles.filterButtonText, showDealsOnly && styles.filterButtonTextActive]}>
                Deals Only
              </Text>
            </Pressable>
          </View>

          {loadingAllDeals ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#3b82f6" />
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
                <Ionicons name="close" size={24} color="#6b7280" />
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
                  <Ionicons name="list-outline" size={48} color="#9aa0a6" />
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
                      <Ionicons name="list" size={24} color="#4f46e5" />
                    </View>
                    <View style={styles.listOptionInfo}>
                      <Text style={styles.listOptionName}>{list.list_name}</Text>
                      <Text style={styles.listOptionCount}>
                        {list.item_count || 0} {list.item_count === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9aa0a6" />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    paddingTop: 48,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111',
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
    color: '#6b7280',
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
    color: '#111',
    marginBottom: 2,
  },
  dealCountText: {
    fontSize: 13,
    color: '#6b7280',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  dealsScroll: {
    paddingHorizontal: 16,
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
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    color: '#dc2626',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#10b981',
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
    backgroundColor: '#fff',
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
    borderBottomColor: '#e5e7eb',
  },
  listModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  productPreview: {
    padding: 16,
    backgroundColor: '#f8f9fb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  productPreviewText: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#111',
    marginTop: 12,
    marginBottom: 8,
  },
  noListsSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
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
    color: '#111',
    marginBottom: 2,
  },
  listOptionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
});
