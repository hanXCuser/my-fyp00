import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ProductDealComparison, fetchAllDealsForProduct, Product } from '@/utils/deals-grouping';

interface ProductComparisonModalProps {
  visible: boolean;
  productId: number;
  onClose: () => void;
  onAddToList?: (deal: ProductDealComparison) => void;
  onToggleFavourite?: (deal: ProductDealComparison) => void;
}

export default function ProductComparisonModal({
  visible,
  productId,
  onClose,
  onAddToList,
  onToggleFavourite,
}: ProductComparisonModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<ProductDealComparison[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (visible && productId) {
      loadProductDeals();
    }
  }, [visible, productId]);

  const loadProductDeals = async () => {
    setLoading(true);
    try {
      const data = await fetchAllDealsForProduct(productId);
      setDeals(data);
      if (data.length > 0 && data[0].products) {
        setProduct(data[0].products);
      }
    } catch (error) {
      console.error('Error loading product deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `Rs ${price.toFixed(0)}`;

  const formatDiscount = (discount?: number) => {
    if (!discount) return null;
    return `${discount.toFixed(0)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStoreBadgeColor = (supermarketName: string): string => {
    const name = supermarketName.toLowerCase();
    if (name.includes('intermarkt') || name.includes('intermart')) return '#10b981';
    if (name.includes('winners')) return '#ef4444';
    if (name.includes('super u') || name.includes('spar')) return '#22c55e';
    return colors.primary;
  };

  const getStoreBadgeInitial = (supermarketName: string): string => {
    const name = supermarketName.toLowerCase();
    if (name.includes('intermarkt') || name.includes('intermart')) return 'I';
    if (name.includes('winners')) return 'W';
    if (name.includes('super u')) return 'U';
    if (name.includes('spar')) return 'S';
    return supermarketName.charAt(0).toUpperCase();
  };

  const cheapestPrice = deals.length > 0 ? deals[0].deal_price : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Price Comparison</Text>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Product Details */}
            {product && (
              <View style={styles.productSection}>
                {product.image_url && (
                  <Image
                    source={{ uri: product.image_url }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.productInfo}>
                  {product.category && (
                    <Text style={[styles.categoryBadge, { color: colors.primary }]}>
                      {product.category.toUpperCase()}
                    </Text>
                  )}
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {product.name}
                  </Text>
                  {product.unit && (
                    <Text style={[styles.productUnit, { color: colors.textMuted }]}>
                      {product.unit}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Best Price Section */}
            {deals.length > 0 && (
              <View style={styles.bestPriceSection}>
                <View style={styles.bestPriceHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.bestPriceLabel}>BEST PRICE</Text>
                </View>
                <View style={styles.bestPriceCard}>
                  <View style={styles.priceRow}>
                    <Text style={styles.bestPrice}>{formatPrice(cheapestPrice)}</Text>
                    <View
                      style={[
                        styles.storeBadge,
                        { backgroundColor: getStoreBadgeColor(deals[0].retailers?.supermarkets?.name || '') }
                      ]}
                    >
                      <Text style={styles.storeBadgeText}>
                        {getStoreBadgeInitial(deals[0].retailers?.supermarkets?.name || '')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.storeName}>
                    {deals[0].retailers?.supermarkets?.name || deals[0].retailers?.name || 'Unknown Store'}
                  </Text>
                </View>
              </View>
            )}

            {/* Store Prices List */}
            {deals.length > 0 && (
              <View style={styles.storesSection}>
                <View style={styles.storesSectionHeader}>
                  <Ionicons name="storefront-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.storesSectionTitle, { color: colors.text }]}>
                    Store Prices
                  </Text>
                </View>

                {deals.map((deal, index) => (
                  <View
                    key={deal.deal_id}
                    style={[
                      styles.storeCard,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder }
                    ]}
                  >
                    <View style={styles.storeCardLeft}>
                      <View
                        style={[
                          styles.storeIcon,
                          { backgroundColor: getStoreBadgeColor(deal.retailers?.supermarkets?.name || '') }
                        ]}
                      >
                        <Text style={styles.storeIconText}>
                          {getStoreBadgeInitial(deal.retailers?.supermarkets?.name || '')}
                        </Text>
                      </View>
                      <View style={styles.storeInfo}>
                        <Text style={[styles.storeCardName, { color: colors.text }]}>
                          {deal.retailers?.supermarkets?.name || deal.retailers?.name || 'Unknown Store'}
                        </Text>
                        <Text style={[styles.updatedText, { color: colors.textMuted }]}>
                          Valid until {formatDate(deal.end_date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.storeCardRight}>
                      <Text style={[styles.storePrice, { color: colors.text }]}>
                        {formatPrice(deal.deal_price)}
                      </Text>
                      {index === 0 && (
                        <View style={styles.cheapestBadge}>
                          <Text style={styles.cheapestText}>CHEAPEST</Text>
                        </View>
                      )}
                      {deal.discount && deal.discount > 0 && (
                        <Text style={[styles.discountText, { color: '#10b981' }]}>
                          {formatDiscount(deal.discount)} off
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {deals.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No active deals found for this product
                </Text>
              </View>
            )}

            {/* Price Alert Button */}
            {deals.length > 0 && (
              <TouchableOpacity
                style={[styles.alertButton, { backgroundColor: colors.text }]}
                onPress={() => {
                  // TODO: Implement price alert functionality
                  console.log('Set price alert for product:', productId);
                }}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.background} />
                <Text style={[styles.alertButtonText, { color: colors.background }]}>
                  Set Price Alert
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  productSection: {
    padding: 20,
    alignItems: 'center',
  },
  productImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  productInfo: {
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 16,
  },
  bestPriceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  bestPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bestPriceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  bestPriceCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bestPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
  },
  storeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  storeName: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
  },
  storesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  storesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  storeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  storeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  storeInfo: {
    flex: 1,
  },
  storeCardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  updatedText: {
    fontSize: 12,
  },
  storeCardRight: {
    alignItems: 'flex-end',
  },
  storePrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cheapestBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  cheapestText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
