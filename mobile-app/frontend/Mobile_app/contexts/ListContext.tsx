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

type ListItem = {
  item_id: number;
  product_id: number;
  quantity: number;
  is_checked: boolean;
  product?: Product;
};

type ShoppingList = {
  list_id: number;
  list_name: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
  items?: ListItem[];
};

type ListContextType = {
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  isLoading: boolean;
  createList: (name: string) => Promise<void>;
  deleteList: (listId: number) => Promise<void>;
  renameList: (listId: number, newName: string) => Promise<void>;
  addItemToList: (listId: number, product: Product) => Promise<void>;
  removeItemFromList: (listId: number, productId: number) => Promise<void>;
  toggleItemChecked: (listId: number, itemId: number, isChecked: boolean) => Promise<void>;
  loadListItems: (listId: number) => Promise<void>;
  isInList: (productId: number, listId?: number) => boolean;
  
  // Legacy support for backwards compatibility
  listItems: Product[];
  addToList: (product: Product) => Promise<void>;
  removeFromList: (productId: number) => void;
};

const ListContext = createContext<ListContextType | undefined>(undefined);

export function ListProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load all lists when user logs in
  useEffect(() => {
    if (user) {
      loadLists();
    } else {
      setLists([]);
      setCurrentList(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadLists = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          list_id,
          list_name,
          created_at,
          updated_at,
          list_items (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listsWithCount = data?.map((list: any) => ({
        list_id: list.list_id,
        list_name: list.list_name,
        created_at: list.created_at,
        updated_at: list.updated_at,
        item_count: list.list_items?.[0]?.count || 0,
      })) || [];

      setLists(listsWithCount);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createList = async (name: string) => {
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          list_name: name,
        })
        .select()
        .single();

      if (error) throw error;

      const newList: ShoppingList = {
        list_id: data.list_id,
        list_name: data.list_name,
        created_at: data.created_at,
        updated_at: data.updated_at,
        item_count: 0,
      };

      setLists((prev) => [newList, ...prev]);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const deleteList = async (listId: number) => {
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    const listToDelete = lists.find((l) => l.list_id === listId);
    setLists((prev) => prev.filter((l) => l.list_id !== listId));

    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('list_id', listId)
        .eq('user_id', user.id);

      if (error) {
        if (listToDelete) {
          setLists((prev) => [...prev, listToDelete]);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const renameList = async (listId: number, newName: string) => {
    if (!user) return;

    const oldList = lists.find((l) => l.list_id === listId);
    setLists((prev) =>
      prev.map((l) => (l.list_id === listId ? { ...l, list_name: newName } : l))
    );

    try {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ list_name: newName })
        .eq('list_id', listId)
        .eq('user_id', user.id);

      if (error) {
        if (oldList) {
          setLists((prev) =>
            prev.map((l) => (l.list_id === listId ? oldList : l))
          );
        }
        throw error;
      }
    } catch (error) {
      console.error('Error renaming list:', error);
    }
  };

  const loadListItems = async (listId: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('list_items')
        .select(`
          item_id,
          product_id,
          quantity,
          is_checked,
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
        .eq('list_id', listId);

      if (error) throw error;

      const items: ListItem[] = data?.map((item: any) => ({
        item_id: item.item_id,
        product_id: item.product_id,
        quantity: item.quantity,
        is_checked: item.is_checked,
        product: item.products,
      })) || [];

      setCurrentList((prev) =>
        prev?.list_id === listId ? { ...prev, items } : prev
      );
    } catch (error) {
      console.error('Error loading list items:', error);
    }
  };

  const addItemToList = async (listId: number, product: Product) => {
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    try {
      const { error } = await supabase
        .from('list_items')
        .insert({
          list_id: listId,
          product_id: product.product_id,
          quantity: 1,
        });

      if (error) throw error;

      // Update item count
      setLists((prev) =>
        prev.map((l) =>
          l.list_id === listId ? { ...l, item_count: (l.item_count || 0) + 1 } : l
        )
      );

      // Reload items if viewing this list
      if (currentList?.list_id === listId) {
        await loadListItems(listId);
      }
    } catch (error) {
      console.error('Error adding item to list:', error);
    }
  };

  const removeItemFromList = async (listId: number, productId: number) => {
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    try {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('product_id', productId);

      if (error) throw error;

      // Update item count
      setLists((prev) =>
        prev.map((l) =>
          l.list_id === listId ? { ...l, item_count: Math.max((l.item_count || 0) - 1, 0) } : l
        )
      );

      // Reload items if viewing this list
      if (currentList?.list_id === listId) {
        await loadListItems(listId);
      }
    } catch (error) {
      console.error('Error removing item from list:', error);
    }
  };

  const toggleItemChecked = async (listId: number, itemId: number, isChecked: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('list_items')
        .update({ is_checked: isChecked })
        .eq('item_id', itemId);

      if (error) throw error;

      if (currentList?.list_id === listId && currentList.items) {
        setCurrentList({
          ...currentList,
          items: currentList.items.map((item) =>
            item.item_id === itemId ? { ...item, is_checked: isChecked } : item
          ),
        });
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const isInList = (productId: number, listId?: number) => {
    if (listId && currentList?.list_id === listId && currentList.items) {
      return currentList.items.some((item) => item.product_id === productId);
    }
    return false;
  };

  // Legacy support - use first list as default
  const listItems: Product[] =
    currentList?.items?.map((item) => item.product as Product) || [];

  const addToList = async (product: Product) => {
    if (lists.length === 0) {
      await createList('My List');
      await loadLists();
    }
    const defaultList = lists[0];
    if (defaultList) {
      await addItemToList(defaultList.list_id, product);
    }
  };

  const removeFromList = (productId: number) => {
    const defaultList = lists[0];
    if (defaultList) {
      removeItemFromList(defaultList.list_id, productId);
    }
  };

  return (
    <ListContext.Provider
      value={{
        lists,
        currentList,
        isLoading,
        createList,
        deleteList,
        renameList,
        addItemToList,
        removeItemFromList,
        toggleItemChecked,
        loadListItems,
        isInList,
        listItems,
        addToList,
        removeFromList,
      }}
    >
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
