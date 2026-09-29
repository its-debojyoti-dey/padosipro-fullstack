import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FirstLoginProfileScreenProps {
  onProfileComplete: () => void;
}

export const FirstLoginProfileScreen: React.FC<FirstLoginProfileScreenProps> = ({
  onProfileComplete,
}) => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    mobileNumber?: string;
    address?: string;
  }>({});

  const { markProfileCompleted } = useAuth();

  const validate = (): boolean => {
    const errs: typeof errors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name (at least 2 characters)';
    }

    const indianMobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    const cleanPhone = mobileNumber.replace(/\s+/g, '');
    if (!cleanPhone) {
      errs.mobileNumber = 'Mobile number is required';
    } else if (!indianMobileRegex.test(cleanPhone)) {
      errs.mobileNumber = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }

    if (!address.trim() || address.trim().length < 5) {
      errs.address = 'Please enter your delivery / residence address (at least 5 characters)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await apiClient.post('/user/profile', {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim(),
        businessName: businessName.trim() || undefined,
      });

      if (res.data.success) {
        markProfileCompleted();
        onProfileComplete();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to save profile. Please check your inputs.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.badgeCircle}>
            <Feather name="user-check" size={26} color={theme.colors.primary} />
          </View>
          <Text style={styles.badgeLabel}>Step 1 of 2: Onboarding</Text>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            Your Lifestyle Manager needs these details to coordinate doorstep services and deliveries.
          </Text>
        </View>

        <View style={styles.card}>
          <InputField
            label="Full Name *"
            placeholder="e.g. Debojyoti Dey"
            value={fullName}
            onChangeText={(txt) => {
              setFullName(txt);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            leftIcon="user"
            error={errors.fullName}
          />

          <InputField
            label="Mobile Number (India +91) *"
            placeholder="e.g. 9876543210"
            value={mobileNumber}
            onChangeText={(txt) => {
              setMobileNumber(txt);
              if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: undefined }));
            }}
            keyboardType="phone-pad"
            leftIcon="phone"
            error={errors.mobileNumber}
            helperText="10-digit mobile number for Lifestyle Manager calls & SMS updates"
          />

          <InputField
            label="Delivery / Household Address *"
            placeholder="Flat/House No, Building, Street, City"
            value={address}
            onChangeText={(txt) => {
              setAddress(txt);
              if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
            }}
            multiline
            numberOfLines={3}
            style={{ height: 75, textAlignVertical: 'top' }}
            leftIcon="map-pin"
            error={errors.address}
          />

          <InputField
            label="Business Name (Optional)"
            placeholder="Company, venture, or firm name"
            value={businessName}
            onChangeText={setBusinessName}
            leftIcon="briefcase"
            helperText="Optional — only needed if you require corporate concierge or GST billing"
          />

          <Button
            title="Save & Select Tasks"
            onPress={handleSaveProfile}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  badgeLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 320,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
});
