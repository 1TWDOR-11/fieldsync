import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext, useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}
