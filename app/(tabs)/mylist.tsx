import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, FlatList, Image, Pressable } from 'react-native';
import { useList } from '@/contexts/ListContext';
import { useState } from 'react';

export default function MyListScreen() {
  const { listItems, removeFromList } = useList();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const renderListItem = ({ item }: { item: any }) => {
    const hasDeal = Boolean(item.deal);
    const displayPrice = hasDeal ? item.deal.deal_price : 0;

    return (
      <View style={styles.listItem}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/80' }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
          {hasDeal && (
            <View style={styles.priceContainer}>
              <Text style={styles.itemPrice}>${displayPrice.toFixed(2)}</Text>
              <Text style={styles.itemDiscount}>-{item.deal.discount}%</Text>
            </View>
          )}
        </View>
        <Pressable
          style={styles.removeButton}
          onPress={() => removeFromList(item.product_id)}>
          <Ionicons name="close-circle" size={24} color="#ff3366" />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My List</Text>
      {listItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={80} color="#9aa0a6" />
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add products from the Home tab to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.product_id}
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
    paddingHorizontal: 16,
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
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e9eef5',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  itemDiscount: {
    marginLeft: 8,
    color: '#ff3366',
    fontWeight: '600',
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
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
