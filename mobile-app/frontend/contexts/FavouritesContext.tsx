import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

type Deal = {
  deal_id: number;
  product_id: number;
  supermarket_id?: number;
  retailer_id: number;
  pamphlet_id?: number;
  title: string;
  description?: string;
  deal_price: number;
  original_price?: number;
  discount?: number;
  start_date: string;
  end_date: string;
  source: string;
  created_at?: string;
};

type Product = {
  product_id: number;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  description?: string;
  deal?: Deal | null;
};

type FavouritesContextType = {
  favouriteItems: Product[];
  addToFavourites: (product: Product) => void;
  removeFromFavourites: (productId: number) => void;
  isFavourite: (productId: number) => boolean;
  isLoading: boolean;
};

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favouriteItems, setFavouriteItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load favourites from database when user logs in
  useEffect(() => {
    if (user) {
      loadFavourites();
    } else {
      setFavouriteItems([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadFavourites = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_favourites')
        .select(`
          product_id,
          products (
            product_id,
            name,
            brand,
            category,
            unit,
            image_url,
            description
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const products = data?.map((item: any) => ({
        product_id: item.products.product_id,
        name: item.products.name,
        brand: item.products.brand,
        category: item.products.category,
        unit: item.products.unit,
        image_url: item.products.image_url,
        description: item.products.description,
      })) || [];

      setFavouriteItems(products);
    } catch (error) {
      console.error('Error loading favourites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToFavourites = async (product: Product) => {
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    // Optimistic update
    setFavouriteItems((prev) => {
      if (prev.find((p) => p.product_id === product.product_id)) {
        return prev;
      }
      return [...prev, product];
    });

    try {
      const { error } = await supabase
        .from('user_favourites')
        .insert({
          user_id: user.id,
          product_id: product.product_id,
        });

      if (error) {
        // Revert on error
        setFavouriteItems((prev) => prev.filter((p) => p.product_id !== product.product_id));
        console.error('Error adding to favourites:', error);
      }
    } catch (error) {
      // Revert on error
      setFavouriteItems((prev) => prev.filter((p) => p.product_id !== product.product_id));
      console.error('Error adding to favourites:', error);
    }
  };

  const removeFromFavourites = async (productId: number) => {
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    // Optimistic update
    const removedItem = favouriteItems.find((p) => p.product_id === productId);
    setFavouriteItems((prev) => prev.filter((p) => p.product_id !== productId));

    try {
      const { error } = await supabase
        .from('user_favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        // Revert on error
        if (removedItem) {
          setFavouriteItems((prev) => [...prev, removedItem]);
        }
        console.error('Error removing from favourites:', error);
      }
    } catch (error) {
      // Revert on error
      if (removedItem) {
        setFavouriteItems((prev) => [...prev, removedItem]);
      }
      console.error('Error removing from favourites:', error);
    }
  };

  const isFavourite = (productId: number) => {
    return favouriteItems.some((p) => p.product_id === productId);
  };

  return (
    <FavouritesContext.Provider value={{ favouriteItems, addToFavourites, removeFromFavourites, isFavourite, isLoading }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const context = useContext(FavouritesContext);
  if (!context) {
    throw new Error('useFavourites must be used within a FavouritesProvider');
  }
  return context;
}
