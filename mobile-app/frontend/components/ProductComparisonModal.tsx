
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ActivityIndicator, FlatList, StyleSheet, Pressable, Image } from 'react-native';
import { fetchCheapestProducts, CheapestProduct } from '@/utils/deals-grouping';
import { Colors } from '@/constants/theme';

interface ProductComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  keyword: string;
}

export default function ProductComparisonModal({ visible, onClose, keyword }: ProductComparisonModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<CheapestProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !keyword) return;
    setLoading(true);
    setError(null);
    fetchCheapestProducts(10, undefined, keyword)
      .then(setProducts)
      .catch(() => setError('Failed to load price comparison'))
      .finally(() => setLoading(false));
  }, [visible, keyword]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Price Comparison for "{keyword}"</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.light.accentPrimary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={item => item.deal_id.toString()}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                  ) : (
                    <View style={styles.imagePlaceholder} />
                  )}
                  <View style={styles.info}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.storeName}>{item.store_name}</Text>
                    <Text style={styles.price}>Rs {item.cheapest_price.toFixed(2)}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No similar products found.</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 2,
  },
  closeText: {
    color: Colors.light.accentPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginTop: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  storeName: {
    color: '#888',
    fontSize: 13,
  },
  price: {
    color: Colors.light.accentPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  empty: {
    marginTop: 24,
    color: '#888',
    fontSize: 15,
  },
});
