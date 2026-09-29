import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { theme } from './src/constants/theme';
import { LoadingState } from './src/components/StateView';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { VerifyOtpScreen } from './src/screens/VerifyOtpScreen';
import { FirstLoginProfileScreen } from './src/screens/FirstLoginProfileScreen';
import { TaskSelectionScreen } from './src/screens/TaskSelectionScreen';
import { HomeScreen } from './src/screens/HomeScreen';

function MainNavigator() {
  const { user, token, isLoading } = useAuth();

  // Auth flow view state
  const [authView, setAuthView] = useState<'login' | 'register' | 'verify'>('login');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string>('');

  // App flow view state
  const [showTaskSelectorModal, setShowTaskSelectorModal] = useState<boolean>(false);

  if (isLoading) {
    return <LoadingState message="Connecting to PadosiPro..." />;
  }

  // Unauthenticated Stack
  if (!token || !user) {
    if (authView === 'register') {
      return (
        <RegisterScreen
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToVerify={(email) => {
            setPendingVerifyEmail(email);
            setAuthView('verify');
          }}
        />
      );
    }

    if (authView === 'verify') {
      return (
        <VerifyOtpScreen
          email={pendingVerifyEmail}
          onVerificationSuccess={() => {
            setAuthView('login');
          }}
          onBackToRegister={() => setAuthView('register')}
        />
      );
    }

    // Default: LoginScreen
    return (
      <LoginScreen
        onNavigateToRegister={() => setAuthView('register')}
        onNavigateToVerify={(email) => {
          setPendingVerifyEmail(email);
          setAuthView('verify');
        }}
      />
    );
  }

  // Authenticated Stack: First-login profile gate
  if (!user.hasProfile) {
    return (
      <FirstLoginProfileScreen
        onProfileComplete={() => {
          setShowTaskSelectorModal(true);
        }}
      />
    );
  }

  // Task Selection screen (opened after first profile creation or via "Add More Tasks")
  if (showTaskSelectorModal) {
    return (
      <TaskSelectionScreen
        onSelectionConfirmed={() => setShowTaskSelectorModal(false)}
        onCancel={() => setShowTaskSelectorModal(false)}
      />
    );
  }

  // Home Screen: Lifestyle Dashboard with selected tasks
  return (
    <HomeScreen
      onOpenTaskSelector={() => setShowTaskSelectorModal(true)}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor={theme.colors.background} />
        <MainNavigator />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
