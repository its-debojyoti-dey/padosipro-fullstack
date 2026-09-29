import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Button } from '../components/Button';
import { apiClient } from '../services/api';

interface VerifyOtpScreenProps {
  email: string;
  onVerificationSuccess: () => void;
  onBackToRegister: () => void;
}

export const VerifyOtpScreen: React.FC<VerifyOtpScreenProps> = ({
  email,
  onVerificationSuccess,
  onBackToRegister,
}) => {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(30);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (value: string, index: number) => {
    setErrorMsg(null);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto advance focus to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullOtp = otpDigits.join('');

  const handleVerify = async () => {
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiClient.post('/auth/verify-otp', {
        email,
        otp: fullOtp,
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Email verified successfully!');
        setTimeout(() => {
          onVerificationSuccess();
        }, 800);
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      const msg = errorData?.error || 'Verification failed. Please try again.';
      setErrorMsg(msg);
      // Clear OTP on error so user can re-enter
      if (errorData?.isLocked) {
        setOtpDigits(['', '', '', '', '', '']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiClient.post('/auth/resend-otp', { email });
      if (res.data.success) {
        setCooldown(30);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg('A fresh verification code has been dispatched to your email.');
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to resend code.';
      setErrorMsg(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity
          onPress={onBackToRegister}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.colors.text} />
          <Text style={styles.backText}>Change email</Text>
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Feather name="mail" size={32} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit verification code to{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Feather name="alert-triangle" size={16} color={theme.colors.danger} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {successMsg && (
          <View style={styles.successBanner}>
            <Feather name="check-circle" size={16} color={theme.colors.success} />
            <Text style={styles.successBannerText}>{successMsg}</Text>
          </View>
        )}

        {/* 6 Digit Inputs */}
        <View style={styles.otpRow}>
          {otpDigits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                errorMsg ? styles.otpBoxError : null,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(val) => handleDigitChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          disabled={fullOtp.length !== 6}
          style={styles.verifyBtn}
        />

        <View style={styles.resendSection}>
          <Text style={styles.resendPrompt}>Didn't receive the code? </Text>
          {cooldown > 0 ? (
            <Text style={styles.cooldownText}>Resend in {cooldown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendLink}>
                {resending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={14} color={theme.colors.textMuted} />
          <Text style={styles.infoText}>
            Code is valid for 10 minutes. For testing, check the backend server terminal console if SMTP is unconfigured.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  emailHighlight: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
    gap: 8,
  },
  errorBannerText: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.xs,
    flex: 1,
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
    gap: 8,
  },
  successBannerText: {
    color: theme.colors.success,
    fontSize: theme.typography.sizes.xs,
    flex: 1,
    fontWeight: '500',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    marginBottom: theme.spacing.xl,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  otpBoxFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxError: {
    borderColor: theme.colors.danger,
    backgroundColor: '#FFFBFB',
  },
  verifyBtn: {
    width: '100%',
    maxWidth: 320,
  },
  resendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  resendPrompt: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
  },
  cooldownText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  resendLink: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xl,
    maxWidth: 320,
    gap: 6,
  },
  infoText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
