import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Button } from './Button';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not reach the server. Please check your connection and try again.',
  onRetry,
}) => (
  <View style={styles.centerContainer}>
    <View style={styles.errorIconCircle}>
      <Feather name="alert-triangle" size={32} color={theme.colors.danger} />
    </View>
    <Text style={styles.titleText}>{title}</Text>
    <Text style={styles.descriptionText}>{message}</Text>
    {onRetry && (
      <Button
        title="Try Again"
        variant="outline"
        onPress={onRetry}
        style={styles.retryButton}
        icon={<Feather name="refresh-cw" size={16} color={theme.colors.text} style={{ marginRight: 6 }} />}
      />
    )}
  </View>
);

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: keyof typeof Feather.glyphMap;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'inbox',
  actionText,
  onAction,
}) => (
  <View style={styles.centerContainer}>
    <View style={styles.emptyIconCircle}>
      <Feather name={icon} size={36} color={theme.colors.primary} />
    </View>
    <Text style={styles.titleText}>{title}</Text>
    <Text style={styles.descriptionText}>{description}</Text>
    {actionText && onAction && (
      <Button
        title={actionText}
        onPress={onAction}
        style={styles.actionButton}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  titleText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    minWidth: 140,
  },
  actionButton: {
    minWidth: 160,
  },
});
