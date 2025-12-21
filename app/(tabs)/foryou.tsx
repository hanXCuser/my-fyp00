import { StyleSheet, Text, View, FlatList, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useList } from '@/contexts/ListContext';

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
  deal?: Deal | null;
};

export default function ForYouScreen() {
  const { favouriteItems, removeFromFavourites } = useFavourites();
  const { addToList, removeFromList, isInList } = useList();

  const renderFavouriteProduct = ({ item }: { item: Product }) => {
    const hasDeal = Boolean(item.deal);
    const displayPrice = hasDeal ? item.deal!.deal_price : 0;
    const itemInList = isInList(item.product_id);

    return (
      <View style={styles.card}>
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/400' }} 
          style={styles.cardImage} 
          resizeMode="cover" 
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
              <Pressable 
                onPress={() => {
                  Alert.alert(
                    'Remove from Favorites',
                    `Remove ${item.name} from favorites?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Remove', 
                        style: 'destructive',
                        onPress: () => removeFromFavourites(item.product_id)
                      }
                    ]
                  );
                }}
                hitSlop={10}
              >
                <Ionicons name="heart" size={22} color="#ff3366" />
              </Pressable>
            </View>
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
          <Pressable
            style={[styles.actionButton, itemInList && styles.actionButtonActive]}
            onPress={() => {
              if (itemInList) {
                removeFromList(item.product_id);
              } else {
                addToList(item);
              }
            }}
          >
            <Text style={[styles.actionButtonText, itemInList && styles.actionButtonTextActive]}>
              {itemInList ? 'Added to list' : 'Add to list'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Favorites</Text>
      {favouriteItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>Tap the heart icon on products to save them here</Text>
        </View>
      ) : (
        <FlatList
          data={favouriteItems}
          keyExtractor={(item) => item.product_id}
          renderItem={renderFavouriteProduct}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111',
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#edf0f5',
    marginBottom: 16,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e9eef5',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    marginRight: 12,
  },
  brandText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginRight: 8,
  },
  discount: {
    color: '#ff3366',
    fontWeight: '600',
    fontSize: 14,
  },
  noDealText: {
    fontSize: 13,
    color: '#9aa0a6',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#0d9488',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtonTextActive: {
    color: '#e0f2f1',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
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
