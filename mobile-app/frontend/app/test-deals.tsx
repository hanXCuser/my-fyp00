import { StyleSheet, Text, View, FlatList, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useList } from '@/contexts/ListContext';
import { fetchDealsGroupedByDateRange, GroupedDeals, DealWithProduct } from '@/utils/deals-grouping';
import DealCard from '@/components/DealCard';

export default function DealsTestScreen() {
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const { addToList, removeFromList, isInList } = useList();
  
  const [groupedDeals, setGroupedDeals] = useState<GroupedDeals[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDealsGroupedByDateRange(10);
      setGroupedDeals(data);
      console.log(`Loaded ${data.length} deal groups`);
    } catch (error) {
      console.error('Error fetching grouped deals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDeals();
    setRefreshing(false);
  }, [fetchDeals]);

  const handleDealPress = (deal: DealWithProduct) => {
    console.log('Deal pressed:', deal.title || deal.products?.name);
  };

  const handleAddToList = (deal: DealWithProduct) => {
    const product_id = deal.product_id;
    if (isInList(product_id)) {
      removeFromList(product_id);
    } else {
      const product = {
        product_id: product_id,
        name: deal.title || deal.products?.name || 'Unknown',
        brand: deal.products?.brand,
        category: deal.products?.category,
        image_url: deal.products?.image_url,
        deal: deal,
      } as any;
      addToList(product);
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

  const renderDealGroup = ({ item: group }: { item: GroupedDeals }) => {
    return (
      <View style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <View>
            <Text style={styles.dateRange}>Valid: {group.dateRange}</Text>
            <Text style={styles.dealCount}>{group.dealCount} deal{group.dealCount !== 1 ? 's' : ''}</Text>
          </View>
          <Pressable onPress={() => console.log('View all:', group.dateRange)}>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🔥 Hot Deals - TEST</Text>
      
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
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
  dealCount: {
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
});
