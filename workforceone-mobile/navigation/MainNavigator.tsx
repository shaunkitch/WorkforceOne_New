import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { getUser, getUserProducts } from '../lib/supabase';
import LoadingScreen from '../screens/LoadingScreen';
import AuthScreen from '../screens/AuthScreen';
import DashboardNavigator from './DashboardNavigator';
import QRScannerScreen from '../screens/QRScannerScreen';

export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Dashboard: undefined;
  QRScanner?: { onScan: (data: string) => void };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function MainNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProducts, setUserProducts] = useState<string[]>([]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { user } = await getUser();
      if (user) {
        const products = await getUserProducts();
        setUserProducts(products);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    const products = await getUserProducts();
    setUserProducts(products);
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Dashboard">
            {(props) => (
              <DashboardNavigator 
                {...props} 
                userProducts={userProducts}
                onSignOut={() => {
                  setIsAuthenticated(false);
                  setUserProducts([]);
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="QRScanner" 
            component={QRScannerScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Scan QR Code',
              headerStyle: { backgroundColor: '#000' },
              headerTintColor: '#fff'
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth">
            {(props) => (
              <AuthScreen {...props} onAuthSuccess={handleAuthSuccess} />
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="QRScanner" 
            component={QRScannerScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Scan QR Code',
              headerStyle: { backgroundColor: '#000' },
              headerTintColor: '#fff'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}