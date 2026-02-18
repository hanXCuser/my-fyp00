import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DealWithProduct } from '@/utils/deals-grouping';

interface DealCardProps {
  deal: DealWithProduct;
  onPress: () => void;
  onAddToList?: () => void;
  onToggleFavourite?: () => void;
  isInList?: boolean;
  isFavourite?: boolean;
}

export default function DealCard({
  deal,
  onPress,
  onAddToList,
  onToggleFavourite,
  isInList = false,
  isFavourite = false,
}: DealCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const product = deal.products;
  const productName = deal.title || product?.name || 'Unknown Product';
  const hasImage = product?.image_url && product.image_url.trim().length > 0;

  // Calculate discount percentage if not provided
  const discountPercent = deal.discount || 
    (deal.original_price ? Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100) : 0);

  const favouriteIconColor = isFavourite ? colors.danger : colors.card;
  const addButtonIconColor = isInList ? colors.success : colors.card;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Image */}
      {hasImage ? (
        <Image
          source={{ uri: product!.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {productName.substring(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Discount Badge */}
      {discountPercent > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{discountPercent}%</Text>
        </View>
      )}

      {/* Favorite Icon */}
      {onToggleFavourite && (
        <Pressable
          style={styles.favouriteButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavourite();
          }}
          hitSlop={10}
        >
          <Ionicons
            name={isFavourite ? 'heart' : 'heart-outline'}
            size={20}
            color={favouriteIconColor}
          />
        </Pressable>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Product Name */}
        <Text style={styles.title} numberOfLines={2}>
          {productName}
        </Text>

        {/* Brand */}
        {product?.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}

        {/* Price Section */}
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>R</Text>
            <Text style={styles.price}>{deal.deal_price.toFixed(2)}</Text>
          </View>
          {deal.original_price && (
            <Text style={styles.originalPrice}>R{deal.original_price.toFixed(2)}</Text>
          )}
        </View>

        {/* Retailer */}
        {deal.retailers && (
          <View style={styles.retailerBadge}>
            <Text style={styles.retailerText} numberOfLines={1}>
              {deal.retailers.name}
            </Text>
          </View>
        )}

        {/* Add to List Button */}
        {onAddToList && (
          <Pressable
            style={[styles.addButton, isInList && styles.addButtonActive]}
            onPress={(e) => {
              e.stopPropagation();
              onAddToList();
            }}
          >
            <Ionicons
              name={isInList ? 'checkmark' : 'add'}
              size={14}
              color={addButtonIconColor}
            />
            <Text style={[styles.addButtonText, isInList && styles.addButtonTextActive]}>
              {isInList ? 'Added' : 'Add'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      width: 170,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginRight: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    image: {
      width: '100%',
      height: 140,
      backgroundColor: colors.surface,
    },
    placeholderContainer: {
      width: '100%',
      height: 140,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 32,
      fontWeight: '600',
      color: colors.textMuted,
    },
    discountBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.danger,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    discountText: {
      color: colors.card,
      fontSize: 12,
      fontWeight: '700',
    },
    favouriteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 16,
      padding: 6,
    },
    content: {
      padding: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
      lineHeight: 18,
    },
    brand: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 6,
    },
    priceContainer: {
      marginBottom: 6,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 2,
    },
    currency: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.success,
      marginRight: 2,
    },
    price: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.success,
    },
    originalPrice: {
      fontSize: 12,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    retailerBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    retailerText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textMuted,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 5,
      gap: 2,
      alignSelf: 'flex-end',
      maxWidth: 90,
    },
    addButtonActive: {
      backgroundColor: colors.surface,
    },
    addButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.card,
    },
    addButtonTextActive: {
      color: colors.success,
    },
  });
