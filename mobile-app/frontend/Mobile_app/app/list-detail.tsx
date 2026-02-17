import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useList } from '@/contexts/ListContext';
import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ListDetailScreen() {
  const { listId, listName } = useLocalSearchParams<{ listId: string; listName: string }>();
  const { currentList, loadListItems, removeItemFromList, toggleItemChecked } = useList();
  const router = useRouter();

  useEffect(() => {
    if (listId) {
      loadListItems(Number(listId));
    }
  }, [listId]);

  const renderListItem = ({ item }: { item: any }) => {
    const product = item.product;
    if (!product) return null;

    const hasDeal = Boolean(product.deal);
    const displayPrice = hasDeal ? product.deal.deal_price : 0;

    return (
      <View style={styles.listItem}>
        <Pressable
          style={styles.checkbox}
          onPress={() => toggleItemChecked(Number(listId), item.item_id, !item.is_checked)}
        >
          <Ionicons
            name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
            size={28}
            color={item.is_checked ? '#10b981' : '#d1d5db'}
          />
        </Pressable>
        <Image
          source={{ uri: product.image_url || 'https://via.placeholder.com/80' }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text
            style={[styles.itemName, item.is_checked && styles.itemNameChecked]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          {product.brand && (
            <Text style={styles.itemBrand}>{product.brand}</Text>
          )}
          {hasDeal && (
            <View style={styles.priceContainer}>
              <Text style={styles.itemPrice}>${displayPrice.toFixed(2)}</Text>
              <Text style={styles.itemDiscount}>-{product.deal.discount}%</Text>
            </View>
          )}
          {item.quantity > 1 && (
            <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          )}
        </View>
        <Pressable
          style={styles.removeButton}
          onPress={() => removeItemFromList(Number(listId), product.product_id)}
        >
          <Ionicons name="close-circle" size={24} color="#ef4444" />
        </Pressable>
      </View>
    );
  };

  const items = currentList?.items || [];
  const checkedCount = items.filter((item) => item.is_checked).length;
  const totalCount = items.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.heading}>{listName}</Text>
          {totalCount > 0 && (
            <Text style={styles.progressText}>
              {checkedCount} of {totalCount} checked
            </Text>
          )}
        </View>
      </View>

      {!currentList ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading list...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={80} color="#9aa0a6" />
          <Text style={styles.emptyTitle}>This list is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add products from the Home tab to start shopping
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.item_id.toString()}
          renderItem={renderListItem}
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
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#edf0f5',
  },
  checkbox: {
    marginRight: 8,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#e9eef5',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#9aa0a6',
  },
  itemBrand: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  itemDiscount: {
    marginLeft: 8,
    color: '#ff3366',
    fontWeight: '600',
    fontSize: 12,
  },
  quantity: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
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
