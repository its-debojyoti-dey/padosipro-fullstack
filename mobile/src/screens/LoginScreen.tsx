import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToVerify: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onNavigateToVerify,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data.success) {
        await login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      if (err.response?.status === 403 && errorData?.code === 'EMAIL_NOT_VERIFIED') {
        // Unverified user redirected to OTP verification
        onNavigateToVerify(email.trim().toLowerCase());
        return;
      }
      setErrorMessage(errorData?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Feather name="shield" size={28} color={theme.colors.primary} />
          </View>
          <Text style={styles.brandTitle}>PadosiPro</Text>
          <Text style={styles.brandTagline}>You don't manage tasks — we do.</Text>
          <Text style={styles.screenHeading}>Welcome back</Text>
          <Text style={styles.screenSubheading}>
            Sign in to check on your lifestyle tasks and concierge team.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Feather name="alert-triangle" size={16} color={theme.colors.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <InputField
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail"
          />

          <InputField
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              setErrorMessage(null);
            }}
            isPassword
            leftIcon="lock"
          />

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to PadosiPro? </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.footerLink}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  brandTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.accent,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  screenHeading: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  screenSubheading: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorBannerText: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.sm,
    flex: 1,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
  },
  footerLink: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
