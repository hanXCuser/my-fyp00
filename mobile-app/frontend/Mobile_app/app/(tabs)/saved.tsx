import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, FlatList, Image, Pressable } from 'react-native';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/theme';
import { useMemo } from 'react';

export default function SavedScreen() {
  const { favouriteItems, removeFromFavourites } = useFavourites();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderFavouriteItem = ({ item }: { item: any }) => {
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
          onPress={() => removeFromFavourites(item.product_id)}>
          <Ionicons name="heart" size={24} color="#ff3366" />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Saved Favourites</Text>
      {favouriteItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={80} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on products to save them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={favouriteItems}
          keyExtractor={(item) => item.product_id}
          renderItem={renderFavouriteItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 32,
  },
  listItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
