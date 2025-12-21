import React, { createContext, useContext, useState, ReactNode } from 'react';

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

type FavouritesContextType = {
  favouriteItems: Product[];
  addToFavourites: (product: Product) => void;
  removeFromFavourites: (productId: string) => void;
  isFavourite: (productId: string) => boolean;
};

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favouriteItems, setFavouriteItems] = useState<Product[]>([]);

  const addToFavourites = (product: Product) => {
    setFavouriteItems((prev) => {
      if (prev.find((p) => p.product_id === product.product_id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromFavourites = (productId: string) => {
    setFavouriteItems((prev) => prev.filter((p) => p.product_id !== productId));
  };

  const isFavourite = (productId: string) => {
    return favouriteItems.some((p) => p.product_id === productId);
  };

  return (
    <FavouritesContext.Provider value={{ favouriteItems, addToFavourites, removeFromFavourites, isFavourite }}>
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
