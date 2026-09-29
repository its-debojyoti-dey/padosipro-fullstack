import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { LoadingState, ErrorState, EmptyState } from '../components/StateView';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SelectedTask {
  selectionId: string;
  taskId: string;
  name: string;
  description: string;
  subcategory?: string;
  categoryName: string;
  categoryIcon: string;
  status: string;
  assignedManager: string;
  createdAt: string;
}

interface HomeScreenProps {
  onOpenTaskSelector: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenTaskSelector }) => {
  const [tasks, setTasks] = useState<SelectedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { logout, user } = useAuth();

  const fetchSelectedTasks = async () => {
    setError(null);
    try {
      const res = await apiClient.get('/tasks/selected');
      if (res.data.success) {
        setTasks(res.data.selections);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to retrieve tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSelectedTasks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSelectedTasks();
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      logout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of PadosiPro?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  if (loading) {
    return <LoadingState message="Fetching your lifestyle task assignments..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchSelectedTasks} />;
  }

  return (
    <View style={styles.container}>
      <Header
        showLogout
        onLogout={handleLogoutPress}
      />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.selectionId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.dashboardHeader}>
            {/* Lifestyle Manager Banner */}
            <View style={styles.managerCard}>
              <View style={styles.managerHeaderRow}>
                <View style={styles.managerAvatar}>
                  <Feather name="user-check" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.managerMeta}>
                  <Text style={styles.managerLabel}>Dedicated Lifestyle Manager</Text>
                  <Text style={styles.managerName}>Ravi Kumar is assigned</Text>
                  <Text style={styles.managerLocation}>Hyderabad • Verified Concierge</Text>
                </View>
                <View style={styles.activeDotContainer}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeStatusText}>Active</Text>
                </View>
              </View>
              <View style={styles.managerDivider} />
              <Text style={styles.managerBio}>
                Your Lifestyle Manager is actively reviewing your tasks. We coordinate vendors, pickups, and bookings so you don't have to manage them.
              </Text>
            </View>

            {/* Tasks Section Header */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Your Active Tasks</Text>
                <Text style={styles.sectionSubtitle}>
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} under lifestyle management
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onOpenTaskSelector}
                style={styles.addTaskBtn}
              >
                <Feather name="plus" size={16} color={theme.colors.primary} />
                <Text style={styles.addTaskBtnText}>Add More</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No tasks selected yet"
            description="Browse our catalogue and pick household tasks, errands, or travel needs for your Lifestyle Manager."
            icon="clipboard"
            actionText="Select Tasks"
            onAction={onOpenTaskSelector}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskTopRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {item.subcategory || item.categoryName}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.taskName}>{item.name}</Text>
            <Text style={styles.taskDescription}>{item.description}</Text>

            <View style={styles.taskFooter}>
              <View style={styles.managerTag}>
                <Feather name="user" size={13} color={theme.colors.textMuted} />
                <Text style={styles.managerTagText}>Assigned to Ravi</Text>
              </View>
              <Text style={styles.dateTag}>
                {new Date(item.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  dashboardHeader: {
    marginBottom: theme.spacing.md,
  },
  managerCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.2,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  managerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  managerMeta: {
    flex: 1,
  },
  managerLabel: {
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  managerName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: '700',
    color: theme.colors.text,
  },
  managerLocation: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  activeDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  activeStatusText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '700',
  },
  managerDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  managerBio: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  addTaskBtnText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    ...theme.shadows.card,
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  managerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  managerTagText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  dateTag: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
});
