import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useList } from '@/contexts/ListContext';
<<<<<<< Updated upstream
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
=======
import { useTheme } from '@/contexts/ThemeContext';
>>>>>>> Stashed changes

type RecommendedDeal = {
  product_id: number;
  product_name: string;
  category: string;
  retailer: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  supermarket_id: number;
  supermarket_name: string;
  distance?: number;
  reason: string;
  score: number;
  valid_from: string;
  valid_to: string;
};

// Use your computer's network IP so mobile devices on the same LAN can access it
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://v0-mobile-price-comparison-e2tgvy3eu.vercel.app';

export default function ForYouScreen() {
  const { user } = useAuth();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const { addToList, removeFromList, isInList } = useList();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
<<<<<<< Updated upstream
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
  const onAccent = colorScheme === 'dark' ? '#04121b' : '#fff';
  const onSuccess = colorScheme === 'dark' ? '#03180f' : '#fff';
  
=======
  const styles = useMemo(() => createStyles(colors), [colors]);

>>>>>>> Stashed changes
  const [recommendations, setRecommendations] = useState<RecommendedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (err) {
      console.log('Location error:', err);
      setLocation(null);
    }
  }, []);

  const loadRecommendations = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user) {
        setRecommendations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!opts?.silent) {
        setLoading(true);
      }

      try {
        setError(null);
        const params = new URLSearchParams({
          user_id: user.id,
          limit: '20',
        });

        if (location) {
          params.append('latitude', location.latitude.toString());
          params.append('longitude', location.longitude.toString());
          params.append('max_distance', '10');
        }

        const url = `${API_BASE}/api/recommendations/for-you?${params.toString()}`;
        const response = await fetch(url);
        const bodyText = await response.text();

        if (!response.ok) {
          throw new Error(`Failed to load recommendations (${response.status}): ${bodyText}`);
        }

        const data = JSON.parse(bodyText);
        setRecommendations(data.recommendations || []);
      } catch (err: any) {
        console.error('Error loading recommendations:', err);
        setError(err.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [location, user]
  );

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRecommendations({ silent: true });
  };

  const formatPrice = (value: number) => `Rs ${value.toFixed(2)}`;
  const formatDistance = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)} km` : null;

  const renderRecommendation = ({ item }: { item: RecommendedDeal }) => {
    const isFav = isFavourite(item.product_id);
    const inList = isInList(item.product_id);

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.product_name}
                </Text>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <Pressable
                onPress={() => {
                  if (isFav) {
                    removeFromFavourites(item.product_id);
                  } else {
                    addToFavourites({
                      product_id: item.product_id,
                      name: item.product_name,
                      category: item.category,
                    });
                  }
                }}
                hitSlop={10}
              >
<<<<<<< Updated upstream
                <Ionicons 
                  name={isFav ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFav ? colors.danger : colors.icon} 
=======
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFav ? '#ff3366' : colors.textSecondary}
>>>>>>> Stashed changes
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.reasonBadge}>
            <Ionicons name="sparkles" size={14} color={colors.success} />
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>{formatPrice(item.original_price)}</Text>
              <Text style={styles.price}>{formatPrice(item.discounted_price)}</Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discount}>{item.discount_percentage}% OFF</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={colors.icon} />
            <Text style={styles.locationText}>
              {item.supermarket_name} · {item.retailer}
            </Text>
            {formatDistance(item.distance) && (
              <Text style={styles.distanceText}>· {formatDistance(item.distance)}</Text>
            )}
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton, inList && styles.actionButtonActive]}
              onPress={() => {
                if (inList) {
                  removeFromList(item.product_id);
                } else {
                  addToList({
                    product_id: item.product_id,
                    name: item.product_name,
                    category: item.category,
                  }).catch((e) => console.log('Add to list error', e));
                }
              }}
            >
<<<<<<< Updated upstream
              <Ionicons 
                name={inList ? "checkmark-circle" : "add-circle-outline"} 
                size={20} 
                color={inList ? onSuccess : onAccent} 
              />
              <Text style={[styles.actionButtonText, inList && styles.actionButtonTextActive]}>
                {inList ? 'In List' : 'Add to List'}
              </Text>
            </Pressable>
            
            <Pressable style={[styles.actionButton, styles.secondaryButton]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.text} />
=======
              <Ionicons
                name={inList ? 'checkmark-circle' : 'add-circle-outline'}
                size={20}
                color="#fff"
              />
              <Text style={styles.actionButtonText}>{inList ? 'In List' : 'Add to List'}</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                const distanceText = formatDistance(item.distance);
                Alert.alert(
                  item.product_name,
                  `${item.reason}\n${item.discount_percentage}% off at ${item.supermarket_name}${distanceText ? `\n${distanceText} away` : ''}\nValid until ${item.valid_to}`
                );
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
>>>>>>> Stashed changes
              <Text style={styles.secondaryButtonText}>Details</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={colors.icon} />
          <Text style={styles.emptyTitle}>Sign in to see recommendations</Text>
          <Text style={styles.emptySubtitle}>
            Get personalized deals based on your favourites and location
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>For You</Text>
        <View style={styles.loadingContainer}>
<<<<<<< Updated upstream
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Finding best deals for you...</Text>
=======
          <ActivityIndicator size="large" color={colors.accentSecondary} />
          <Text style={styles.loadingText}>Finding the best deals for you...</Text>
>>>>>>> Stashed changes
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>For You</Text>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadRecommendations()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>For You</Text>
        <Text style={styles.subheading}>{recommendations.length} personalized deals</Text>
      </View>

      {recommendations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={64} color={colors.icon} />
          <Text style={styles.emptyTitle}>No recommendations yet</Text>
          <Text style={styles.emptySubtitle}>
            Add products to your favourites or shopping list to get personalized deals
          </Text>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => `${item.product_id}-${item.supermarket_id}`}
          renderItem={renderRecommendation}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

<<<<<<< Updated upstream
const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark') => {
  const onAccent = colorScheme === 'dark' ? colors.background : colors.card;
  const onSuccess = colorScheme === 'dark' ? '#03180f' : '#fff';
  const reasonBackground = colorScheme === 'dark' ? '#133034' : '#e0f2f1';
  const secondaryBackground = colorScheme === 'dark' ? '#1f242c' : '#f3f4f6';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
=======
const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.screenBackground,
>>>>>>> Stashed changes
      paddingHorizontal: 16,
      paddingTop: 48,
    },
    header: {
      marginBottom: 16,
    },
    heading: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 4,
<<<<<<< Updated upstream
      color: colors.text,
    },
    subheading: {
      fontSize: 14,
      color: colors.textMuted,
=======
      color: colors.textPrimary,
    },
    subheading: {
      fontSize: 14,
      color: colors.textSecondary,
>>>>>>> Stashed changes
    },
    listContent: {
      paddingBottom: 32,
    },
    card: {
<<<<<<< Updated upstream
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.cardBorder,
=======
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderColor,
>>>>>>> Stashed changes
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
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
    },
    titleContainer: {
      flex: 1,
      marginRight: 12,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
<<<<<<< Updated upstream
      color: colors.text,
=======
      color: colors.textPrimary,
>>>>>>> Stashed changes
      marginBottom: 4,
    },
    categoryText: {
      fontSize: 13,
<<<<<<< Updated upstream
      color: colors.textMuted,
=======
      color: colors.textSecondary,
>>>>>>> Stashed changes
    },
    reasonBadge: {
      flexDirection: 'row',
      alignItems: 'center',
<<<<<<< Updated upstream
      backgroundColor: reasonBackground,
=======
      backgroundColor: `${colors.accentSecondary}20`,
>>>>>>> Stashed changes
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    reasonText: {
      fontSize: 12,
<<<<<<< Updated upstream
      color: colors.success,
=======
      color: colors.accentSecondary,
>>>>>>> Stashed changes
      fontWeight: '600',
      marginLeft: 4,
    },
    priceContainer: {
      marginBottom: 12,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    originalPrice: {
      fontSize: 14,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
      marginRight: 8,
    },
    price: {
      fontSize: 24,
      fontWeight: '700',
<<<<<<< Updated upstream
      color: colors.text,
    },
    discountBadge: {
      backgroundColor: colors.danger,
=======
      color: colors.textPrimary,
    },
    discountBadge: {
      backgroundColor: '#ff3366',
>>>>>>> Stashed changes
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    discount: {
<<<<<<< Updated upstream
      color: colors.card,
=======
      color: '#fff',
>>>>>>> Stashed changes
      fontWeight: '700',
      fontSize: 12,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    locationText: {
      fontSize: 13,
<<<<<<< Updated upstream
      color: colors.textMuted,
=======
      color: colors.textSecondary,
>>>>>>> Stashed changes
      marginLeft: 4,
      flex: 1,
    },
    distanceText: {
      fontSize: 13,
<<<<<<< Updated upstream
      color: colors.accent,
=======
      color: colors.accentSecondary,
>>>>>>> Stashed changes
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      gap: 6,
    },
    primaryButton: {
<<<<<<< Updated upstream
      backgroundColor: colors.accent,
    },
    actionButtonActive: {
      backgroundColor: colors.success,
    },
    secondaryButton: {
      backgroundColor: secondaryBackground,
    },
    actionButtonText: {
      color: onAccent,
      fontWeight: '600',
      fontSize: 14,
    },
    actionButtonTextActive: {
      color: onSuccess,
    },
    secondaryButtonText: {
      color: colors.text,
=======
      backgroundColor: colors.textPrimary,
    },
    actionButtonActive: {
      backgroundColor: colors.accentSecondary,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
    },
    actionButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
>>>>>>> Stashed changes
      fontWeight: '600',
      fontSize: 14,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
<<<<<<< Updated upstream
      color: colors.textMuted,
=======
      color: colors.textSecondary,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      color: colors.text,
=======
      color: colors.textPrimary,
>>>>>>> Stashed changes
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
<<<<<<< Updated upstream
      color: colors.textMuted,
=======
      color: colors.textSecondary,
>>>>>>> Stashed changes
      textAlign: 'center',
      lineHeight: 20,
    },
    errorState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
<<<<<<< Updated upstream
      color: colors.text,
=======
      color: colors.textPrimary,
>>>>>>> Stashed changes
      marginTop: 16,
      marginBottom: 8,
    },
    errorSubtitle: {
      fontSize: 14,
<<<<<<< Updated upstream
      color: colors.textMuted,
=======
      color: colors.textSecondary,
>>>>>>> Stashed changes
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
<<<<<<< Updated upstream
      backgroundColor: colors.success,
=======
      backgroundColor: colors.accentSecondary,
>>>>>>> Stashed changes
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
    },
    retryButtonText: {
<<<<<<< Updated upstream
      color: onSuccess,
=======
      color: '#fff',
>>>>>>> Stashed changes
      fontWeight: '600',
      fontSize: 14,
    },
  });
<<<<<<< Updated upstream
};
=======
>>>>>>> Stashed changes
