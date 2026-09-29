import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Button } from '../components/Button';
import { LoadingState, ErrorState, EmptyState } from '../components/StateView';
import { apiClient } from '../services/api';

interface Task {
  id: string;
  name: string;
  description: string;
  subcategory?: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: Task[];
}

interface TaskSelectionScreenProps {
  onSelectionConfirmed: () => void;
  onCancel?: () => void;
}

export const TaskSelectionScreen: React.FC<TaskSelectionScreenProps> = ({
  onSelectionConfirmed,
  onCancel,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/tasks/catalog');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load task catalogue. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedTaskIds.size === 0) {
      Alert.alert('No Tasks Selected', 'Please select at least one task you want your Lifestyle Manager to handle.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.post('/tasks/select', {
        taskIds: Array.from(selectedTaskIds),
      });

      if (res.data.success) {
        onSelectionConfirmed();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save selected tasks.');
    } finally {
      setSaving(false);
    }
  };

  // Filter tasks based on category & search query
  const allTasks = categories.flatMap((cat) =>
    cat.tasks.map((t) => ({ ...t, categoryName: cat.name, categoryIcon: cat.icon }))
  );

  const filteredTasks = allTasks.filter((task) => {
    const matchesCategory =
      activeCategoryId === 'all' || task.categoryId === activeCategoryId;
    const matchesSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.subcategory && task.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <LoadingState message="Loading lifestyle tasks catalogue..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchCatalog} />;
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Feather name="x" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>What would you like handled?</Text>
            <Text style={styles.subtitle}>Pick tasks for your Lifestyle Manager</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            placeholder="Search groceries, AC repair, train ticket, doctor..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All Tasks' }, ...categories]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryChipsContainer}
          renderItem={({ item }) => {
            const isActive = activeCategoryId === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategoryId(item.id)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try searching for something else or pick a different category filter."
          icon="search"
          actionText="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setActiveCategoryId('all');
          }}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.taskList}
          renderItem={({ item }) => {
            const isSelected = selectedTaskIds.has(item.id);
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleTaskSelection(item.id)}
                style={[styles.taskCard, isSelected && styles.taskCardSelected]}
              >
                <View style={styles.taskCardContent}>
                  <View style={styles.taskHeaderRow}>
                    <Text style={styles.taskSubcategory}>
                      {item.subcategory || item.categoryName}
                    </Text>
                  </View>
                  <Text style={styles.taskName}>{item.name}</Text>
                  <Text style={styles.taskDescription}>{item.description}</Text>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}
                >
                  {isSelected && <Feather name="check" size={16} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Bottom Sticky Confirmation Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            <Text style={styles.counterNumber}>{selectedTaskIds.size}</Text>{' '}
            {selectedTaskIds.size === 1 ? 'task selected' : 'tasks selected'}
          </Text>
        </View>
        <Button
          title={selectedTaskIds.size === 0 ? 'Select Tasks' : `Confirm Selection (${selectedTaskIds.size})`}
          onPress={handleConfirm}
          disabled={selectedTaskIds.size === 0}
          loading={saving}
          style={styles.confirmBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  closeBtn: {
    marginRight: 10,
    padding: 4,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  categoryChipsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
  taskList: {
    padding: theme.spacing.md,
    paddingBottom: 110,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.2,
    borderColor: theme.colors.border,
    marginBottom: 10,
    ...theme.shadows.card,
  },
  taskCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FBFEFD',
  },
  taskCardContent: {
    flex: 1,
    paddingRight: 12,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskSubcategory: {
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.card,
  },
  counterRow: {
    flex: 1,
  },
  counterText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
  },
  counterNumber: {
    fontWeight: '800',
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.base,
  },
  confirmBtn: {
    minWidth: 170,
  },
});
