import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useList } from '@/contexts/ListContext';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MyListScreen() {
  const { lists, createList, deleteList, renameList, isLoading } = useList();
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<{ id: number; name: string } | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const handleCreateList = async () => {
    if (newListName.trim()) {
      await createList(newListName.trim());
      setNewListName('');
      setModalVisible(false);
    }
  };

  const handleRenameList = async () => {
    if (editingList && newListName.trim()) {
      await renameList(editingList.id, newListName.trim());
      setNewListName('');
      setEditingList(null);
    }
  };

  const handleDeleteList = (listId: number, listName: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${listName}"? All items in this list will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteList(listId),
        },
      ]
    );
  };

  const openEditModal = (listId: number, listName: string) => {
    setEditingList({ id: listId, name: listName });
    setNewListName(listName);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingList(null);
    setNewListName('');
  };

  const renderList = ({ item }: { item: any }) => {
    return (
      <Pressable
        style={styles.listCard}
        onPress={() => router.push(`/list-detail?listId=${item.list_id}&listName=${encodeURIComponent(item.list_name)}`)}
      >
        <View style={styles.listIcon}>
          <Ionicons name="list" size={28} color={colors.accent} />
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.list_name}</Text>
          <Text style={styles.itemCount}>
            {item.item_count || 0} {item.item_count === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={styles.listActions}>
          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              openEditModal(item.list_id, item.list_name);
            }}
            hitSlop={10}
          >
            <Ionicons name="pencil" size={20} color={colors.icon} />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteList(item.list_id, item.list_name);
            }}
            hitSlop={10}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Lists</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color={colors.accent} />
          <Text style={styles.createButtonText}>New List</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptySubtitle}>Loading your lists...</Text>
        </View>
      ) : lists.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={80} color={colors.icon} />
          <Text style={styles.emptyTitle}>No lists yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first shopping list to get started
          </Text>
          <Pressable
            style={styles.emptyCreateButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyCreateButtonText}>Create List</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.list_id.toString()}
          renderItem={renderList}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create/Edit List Modal */}
      <Modal
        visible={modalVisible || editingList !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {editingList ? 'Rename List' : 'Create New List'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="List name (e.g., Weekly Shopping)"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
              maxLength={100}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, !newListName.trim() && styles.saveButtonDisabled]}
                onPress={editingList ? handleRenameList : handleCreateList}
                disabled={!newListName.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {editingList ? 'Save' : 'Create'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 48,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    heading: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    createButtonText: {
      color: colors.accent,
      fontWeight: '600',
      marginLeft: 4,
      fontSize: 14,
    },
    listContent: {
      paddingBottom: 32,
    },
    listCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    listIcon: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: colorScheme === 'dark' ? '#1c2733' : '#eef2ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    listInfo: {
      flex: 1,
    },
    listName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    itemCount: {
      fontSize: 14,
      color: colors.textMuted,
    },
    listActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
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
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyCreateButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
    },
    emptyCreateButtonText: {
      color: colorScheme === 'dark' ? colors.background : colors.card,
      fontWeight: '600',
      fontSize: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      marginBottom: 20,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 16,
    },
    saveButton: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: colorScheme === 'dark' ? '#1f4554' : '#c7d2fe',
    },
    saveButtonText: {
      color: colorScheme === 'dark' ? colors.background : colors.card,
      fontWeight: '600',
      fontSize: 16,
    },
  });
