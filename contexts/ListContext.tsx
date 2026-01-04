import React, { createContext, useContext, useState, ReactNode } from 'react';

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

type ListContextType = {
  listItems: Product[];
  addToList: (product: Product) => void;
  removeFromList: (productId: number) => void;
  isInList: (productId: number) => boolean;
};

const ListContext = createContext<ListContextType | undefined>(undefined);

export function ListProvider({ children }: { children: ReactNode }) {
  const [listItems, setListItems] = useState<Product[]>([]);

  const addToList = (product: Product) => {
    setListItems((prev) => {
      if (prev.find((p) => p.product_id === product.product_id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromList = (productId: number) => {
    setListItems((prev) => prev.filter((p) => p.product_id !== productId));
  };

  const isInList = (productId: number) => {
    return listItems.some((p) => p.product_id === productId);
  };

  return (
    <ListContext.Provider value={{ listItems, addToList, removeFromList, isInList }}>
      {children}
    </ListContext.Provider>
  );
}

export function useList() {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error('useList must be used within a ListProvider');
  }
  return context;
}
