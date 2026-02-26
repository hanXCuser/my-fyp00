// import { StyleSheet, Text, View, Alert, ActivityIndicator, Pressable } from 'react-native';
// import { useEffect, useMemo, useRef, useState } from 'react';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { Ionicons } from '@expo/vector-icons';
// import { supabase } from '@/lib/supabase';
// import { useTheme } from '@/contexts/ThemeContext';
// import { Colors } from '@/constants/theme';

// type LocationType = {
//   latitude: number;
//   longitude: number;
//   latitudeDelta: number;
//   longitudeDelta: number;
// };

// type Branch = {
//   supermarket_id: number;
//   retailer_id?: number;
//   branch_name?: string;
//   address?: string;
//   latitude: number;
//   longitude: number;
//   retailer_name?: string;
// };

// type BranchWithDistance = Branch & {
//   distanceKm: number;
// };

// const TOP_DEALS_COLOR = '#ef4444';

// export default function MapScreen() {
//   const { colorScheme } = useTheme();
//   const colors = Colors[colorScheme];
//   const styles = useMemo(() => createStyles(colors), [colors]);

//   const [location, setLocation] = useState<LocationType | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [isInfoCardMinimized, setIsInfoCardMinimized] = useState(false);
//   const [topDealRetailer, setTopDealRetailer] = useState<{
//     retailerId: number;
//     retailerName: string;
//     goodDealsCount: number;
//   } | null>(null);
//   const mapRef = useRef<MapView | null>(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         await loadBranches();

//         // Request location permissions
//         const { status } = await Location.requestForegroundPermissionsAsync();
        
//         if (status !== 'granted') {
//           setErrorMsg('Permission to access location was denied');
//           setIsLoading(false);
//           Alert.alert(
//             'Location Permission Required',
//             'Please enable location permissions to view the map with your current location.',
//             [{ text: 'OK' }]
//           );
//           return;
//         }

//         // Get current location
//         const currentLocation = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.High,
//         });

//         setLocation({
//           latitude: currentLocation.coords.latitude,
//           longitude: currentLocation.coords.longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         });
//         setIsLoading(false);
//       } catch (error) {
//         console.error('Error getting location:', error);
//         setErrorMsg('Failed to get location');
//         setIsLoading(false);
//         Alert.alert('Error', 'Unable to retrieve your location. Please try again.');
//       }
//     })();
//   }, []);

//   const branchesWithDistance = useMemo(() => {
//     if (!location) return [];

//     return branches
//       .map((branch) => ({
//         ...branch,
//         distanceKm: getDistanceKm(
//           location.latitude,
//           location.longitude,
//           branch.latitude,
//           branch.longitude
//         ),
//       }))
//       .sort((a, b) => a.distanceKm - b.distanceKm);
//   }, [location, branches]);

//   const nearestBranch = useMemo<BranchWithDistance | null>(() => {
//     if (branchesWithDistance.length === 0) return null;
//     return branchesWithDistance[0];
//   }, [branchesWithDistance]);

//   const nearestBranches = useMemo(() => branchesWithDistance.slice(0, 3), [branchesWithDistance]);
//   const isNearestTopDeals = Boolean(
//     nearestBranch && topDealRetailer && nearestBranch.retailer_id === topDealRetailer.retailerId
//   );

//   const loadBranches = async () => {
//     const { data, error } = await supabase
//       .from('supermarkets')
//       .select(`
//         supermarket_id,
//         retailer_id,
//         branch_name,
//         address,
//         latitude,
//         longitude,
//         is_active,
//         retailer:retailers (
//           name
//         )
//       `)
//       .eq('is_active', true)
//       .not('latitude', 'is', null)
//       .not('longitude', 'is', null);

//     if (error) {
//       console.error('Error loading supermarket branches:', error);
//       return;
//     }

//     const mappedBranches: Branch[] = (data || [])
//       .map((item: any) => {
//         const latitude = Number(item.latitude);
//         const longitude = Number(item.longitude);

//         if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
//           return null;
//         }

//         return {
//           supermarket_id: item.supermarket_id,
//           retailer_id: item.retailer_id,
//           branch_name: item.branch_name,
//           address: item.address,
//           latitude,
//           longitude,
//           retailer_name: getRetailerName(item.retailer),
//         };
//       })
//       .filter(Boolean) as Branch[];

//     setBranches(mappedBranches);

//     const today = new Date().toISOString().split('T')[0];
//     const { data: dealsData, error: dealsError } = await supabase
//       .from('deals')
//       .select(`
//         retailer_id,
//         discount,
//         end_date,
//         retailers (
//           name
//         )
//       `)
//       .gte('end_date', today)
//       .not('retailer_id', 'is', null);

//     if (dealsError) {
//       console.error('Error loading deals for top supermarket:', dealsError);
//       setTopDealRetailer(null);
//       return;
//     }

//     const goodDealsCountByRetailer = new Map<number, { count: number; name: string }>();

//     (dealsData || []).forEach((deal: any) => {
//       const retailerId = Number(deal.retailer_id);
//       const discount = Number(deal.discount || 0);

//       if (!Number.isFinite(retailerId) || retailerId <= 0 || discount <= 0) {
//         return;
//       }

//       const retailerName = getRetailerName(deal.retailers) || 'Unknown Supermarket';
//       const current = goodDealsCountByRetailer.get(retailerId);

//       if (!current) {
//         goodDealsCountByRetailer.set(retailerId, { count: 1, name: retailerName });
//       } else {
//         current.count += 1;
//       }
//     });

//     let bestRetailer: { retailerId: number; retailerName: string; goodDealsCount: number } | null = null;

//     goodDealsCountByRetailer.forEach((value, key) => {
//       if (!bestRetailer || value.count > bestRetailer.goodDealsCount) {
//         bestRetailer = {
//           retailerId: key,
//           retailerName: value.name,
//           goodDealsCount: value.count,
//         };
//       }
//     });

//     setTopDealRetailer(bestRetailer);
//   };

//   const centerOnUserLocation = async () => {
//     try {
//       const currentLocation = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });

//       const newRegion = {
//         latitude: currentLocation.coords.latitude,
//         longitude: currentLocation.coords.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       };

//       setLocation(newRegion);
//       mapRef.current?.animateToRegion(newRegion, 1000);
//     } catch (error) {
//       console.error('Error centering location:', error);
//       Alert.alert('Error', 'Unable to center on your location.');
//     }
//   };

//   useEffect(() => {
//     if (!location || branches.length === 0) return;

//     const coordinates = [
//       { latitude: location.latitude, longitude: location.longitude },
//       ...branches.map((branch) => ({ latitude: branch.latitude, longitude: branch.longitude })),
//     ];

//     mapRef.current?.fitToCoordinates(coordinates, {
//       edgePadding: { top: 80, right: 80, bottom: 120, left: 80 },
//       animated: true,
//     });
//   }, [location, branches]);

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={colors.accentPrimary} />
//         <Text style={styles.loadingText}>Getting your location...</Text>
//       </View>
//     );
//   }

//   if (errorMsg || !location) {
//     return (
//       <View style={styles.errorContainer}>
//         <Ionicons name="location-outline" size={64} color={colors.textMuted} />
//         <Text style={styles.errorTitle}>Location Unavailable</Text>
//         <Text style={styles.errorText}>
//           {errorMsg || 'Unable to access your location. Please check your settings.'}
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <MapView
//         ref={(ref) => {
//           mapRef.current = ref;
//         }}
//         style={styles.map}
//         provider={PROVIDER_GOOGLE}
//         initialRegion={location}
//         showsUserLocation={true}
//         showsMyLocationButton={false}
//         showsCompass={true}
//         showsScale={true}
//         loadingEnabled={true}
//       >
//         <Marker
//           coordinate={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//           }}
//           title="You are here"
//           description="Your current location"
//         />

//         {branchesWithDistance.map((branch) => (
//           <Marker
//             key={branch.supermarket_id.toString()}
//             coordinate={{
//               latitude: branch.latitude,
//               longitude: branch.longitude,
//             }}
//             title={`${branch.branch_name || branch.retailer_name || 'Supermarket Branch'}${topDealRetailer && branch.retailer_id === topDealRetailer.retailerId ? ' (Most Deals)' : ''}`}
//             description={
//               `${branch.retailer_name ? `${branch.retailer_name} • ` : ''}${branch.address || 'Branch location'} • ${branch.distanceKm.toFixed(1)} km away`
//             }
//             pinColor={getBranchMarkerColor(
//               branch.retailer_name,
//               branch.branch_name,
//               !!topDealRetailer && branch.retailer_id === topDealRetailer.retailerId
//             )}
//           />
//         ))}
//       </MapView>

//       {/* Recenter Button */}
//       <Pressable style={styles.recenterButton} onPress={centerOnUserLocation}>
//         <Ionicons name="locate" size={24} color={colors.accentPrimary} />
//       </Pressable>

//       {/* Location Info Card */}
//       {isInfoCardMinimized ? (
//         <Pressable
//           style={styles.infoToggleButton}
//           onPress={() => setIsInfoCardMinimized(false)}
//         >
//           <Ionicons name="chevron-up" size={16} color={colors.accentPrimary} />
//           <Text style={styles.infoToggleText}>Show Info</Text>
//         </Pressable>
//       ) : (
//         <View style={styles.infoCard}>
//           <View style={styles.infoCardHeader}>
//             <Text style={styles.infoTitle}>Your Location</Text>
//             <Pressable
//               style={styles.infoCardToggleButton}
//               onPress={() => setIsInfoCardMinimized(true)}
//               hitSlop={8}
//             >
//               <Ionicons name="remove" size={20} color={colors.textSecondary} />
//             </Pressable>
//           </View>

//           <Text style={styles.infoText}>
//             Latitude: {location.latitude.toFixed(6)}
//           </Text>
//           <Text style={styles.infoText}>
//             Longitude: {location.longitude.toFixed(6)}
//           </Text>
//           <Text style={styles.infoText}>Branches loaded: {branches.length}</Text>
//           {nearestBranch && (
//             <Text style={styles.infoText}>
//               Nearest: {nearestBranch.branch_name || nearestBranch.retailer_name || 'Branch'} ({nearestBranch.distanceKm.toFixed(1)} km){isNearestTopDeals ? ' (Most Deals)' : ''}
//             </Text>
//           )}
//           {nearestBranches.length > 0 && (
//             <View style={styles.nearestListContainer}>
//               <Text style={styles.nearestListTitle}>Nearest Branches</Text>
//               {nearestBranches.map((branch, index) => (
//                 <View key={`${branch.supermarket_id}-${index}`} style={styles.nearestListRow}>
//                   <Text style={styles.nearestListText} numberOfLines={1}>
//                     {index + 1}. {branch.branch_name || branch.retailer_name || 'Branch'}{topDealRetailer && branch.retailer_id === topDealRetailer.retailerId ? ' (Most Deals)' : ''}
//                   </Text>
//                   <Text style={styles.nearestListDistance}>{branch.distanceKm.toFixed(1)} km</Text>
//                 </View>
//               ))}
//             </View>
//           )}

//           <View style={styles.legendContainer}>
//             <Text style={styles.legendTitle}>Branch Legend</Text>
//             <View style={styles.legendRow}>
//               <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
//               <Text style={styles.legendText}>Intermart</Text>
//             </View>
//             <View style={styles.legendRow}>
//               <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
//               <Text style={styles.legendText}>Winners</Text>
//             </View>
//             <View style={styles.legendRow}>
//               <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
//               <Text style={styles.legendText}>Super U</Text>
//             </View>
//             <View style={styles.legendRow}>
//               <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
//               <Text style={styles.legendText}>Other</Text>
//             </View>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// function getRetailerName(retailer: any): string | undefined {
//   if (!retailer) return undefined;
//   if (Array.isArray(retailer)) {
//     return retailer[0]?.name;
//   }
//   return retailer.name;
// }

// function getBranchMarkerColor(retailerName?: string, branchName?: string, isTopDealsSupermarket?: boolean) {
//   if (isTopDealsSupermarket) {
//     return TOP_DEALS_COLOR;
//   }

//   const text = `${retailerName || ''} ${branchName || ''}`.toLowerCase();

//   if (text.includes('intermart') || text.includes('intermarkt')) {
//     return '#10b981';
//   }

//   if (text.includes('winners')) {
//     return '#ef4444';
//   }

//   if (text.includes('super u') || text.includes('superu')) {
//     return '#3b82f6';
//   }

//   return '#f59e0b';
// }

// function getDistanceKm(
//   startLat: number,
//   startLng: number,
//   endLat: number,
//   endLng: number
// ) {
//   const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

//   const R = 6371;
//   const dLat = toRadians(endLat - startLat);
//   const dLng = toRadians(endLng - startLng);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRadians(startLat)) *
//       Math.cos(toRadians(endLat)) *
//       Math.sin(dLng / 2) *
//       Math.sin(dLng / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   return R * c;
// }

// const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.screenBackground,
//   },
//   map: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: colors.screenBackground,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: colors.textSecondary,
//   },
//   errorContainer: {
//     flex: 1,
//     backgroundColor: colors.screenBackground,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 24,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     textAlign: 'center',
//   },
//   recenterButton: {
//     position: 'absolute',
//     bottom: 120,
//     right: 16,
//     backgroundColor: colors.cardBackground,
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   infoCard: {
//     position: 'absolute',
//     bottom: 16,
//     left: 16,
//     right: 16,
//     backgroundColor: colors.cardBackground,
//     padding: 16,
//     borderRadius: 12,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   infoCardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   infoCardToggleButton: {
//     padding: 2,
//   },
//   infoTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginBottom: 8,
//   },
//   infoText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginBottom: 4,
//   },
//   legendContainer: {
//     marginTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: colors.borderColor,
//     paddingTop: 8,
//   },
//   legendTitle: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginBottom: 6,
//   },
//   legendRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   legendDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginRight: 8,
//   },
//   legendText: {
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   nearestListContainer: {
//     marginTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: colors.borderColor,
//     paddingTop: 8,
//   },
//   nearestListTitle: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginBottom: 6,
//   },
//   nearestListRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//     gap: 8,
//   },
//   nearestListText: {
//     flex: 1,
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   nearestListDistance: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: colors.textPrimary,
//   },
//   infoToggleButton: {
//     position: 'absolute',
//     bottom: 16,
//     left: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     backgroundColor: colors.cardBackground,
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   infoToggleText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: colors.accentPrimary,
//   },
// });

