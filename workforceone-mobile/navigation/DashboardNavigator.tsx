import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screen imports
import UnifiedDashboardScreen from '../screens/UnifiedDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SyncDebugScreen from '../screens/SyncDebugScreen';
import WorkforceDashboardScreen from '../screens/workforce/WorkforceDashboardScreen';
import TimeDashboardScreen from '../screens/time/TimeDashboardScreen';
import GuardNavigator from './GuardNavigator';

// Utils
import { supabase } from '../lib/supabase';

const Tab = createBottomTabNavigator();

interface UserProduct {
  id: string;
  product_id: string;
  is_active: boolean;
}

interface DashboardNavigatorProps {
  userProducts?: UserProduct[];
}

const DashboardNavigator: React.FC<DashboardNavigatorProps> = ({ 
  userProducts: propUserProducts = []
}) => {
  const [userProducts, setUserProducts] = useState<UserProduct[]>(propUserProducts);
  const [loading, setLoading] = useState(!propUserProducts.length);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!propUserProducts.length) {
      loadUserProducts();
    }
  }, [propUserProducts.length]);

  const loadUserProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: products, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading user products:', error);
        return;
      }

      setUserProducts(products || []);
    } catch (error) {
      console.error('Error in loadUserProducts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Define available products with enhanced metadata
  const availableProducts = [
    {
      id: 'workforce-management',
      name: 'Workforce',
      icon: 'people',
      component: WorkforceDashboardScreen,
      description: 'Team management'
    },
    {
      id: 'time-tracker',
      name: 'Time',
      icon: 'time',
      component: TimeDashboardScreen,
      description: 'Time tracking'
    },
    {
      id: 'guard-management',
      name: 'Guard',
      icon: 'shield-checkmark',
      component: GuardNavigator,
      description: 'Security guard tools'
    }
  ];

  // Filter products based on user access
  const accessibleProducts = availableProducts.filter(product =>
    userProducts.some(up => up.product_id === product.id)
  );

  // Enhanced tab bar styling with better accessibility
  const getTabBarOptions = () => ({
    activeTintColor: '#2563eb',
    inactiveTintColor: '#6b7280',
    style: {
      backgroundColor: '#ffffff',
      borderTopColor: '#e5e7eb',
      borderTopWidth: 1,
      paddingBottom: Math.max(insets.bottom, 10),
      paddingTop: 10,
      height: 70 + Math.max(insets.bottom, 10),
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    labelStyle: {
      fontSize: 12,
      fontWeight: '600' as const,
      marginBottom: 2,
      marginTop: 4,
    },
    tabStyle: {
      paddingVertical: 4,
    },
  });

  const tabBarOptions = getTabBarOptions();

  // Custom tab bar icon renderer with better accessibility
  const renderTabIcon = (iconName: string, color: string, focused: boolean) => (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons 
        name={iconName as any} 
        size={focused ? 26 : 24} 
        color={color}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarOptions.activeTintColor,
        tabBarInactiveTintColor: tabBarOptions.inactiveTintColor,
        tabBarStyle: tabBarOptions.style,
        tabBarLabelStyle: tabBarOptions.labelStyle,
      }}
      initialRouteName="Dashboard"
    >
      {/* Main Dashboard - Always available */}
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => renderTabIcon('home', color, focused),
          tabBarAccessibilityLabel: 'Home Dashboard',
        }}
      >
        {(props) => (
          <UnifiedDashboardScreen {...props} userProducts={userProducts} />
        )}
      </Tab.Screen>

      {/* Product-specific tabs - Only show if user has access */}
      {accessibleProducts.map(product => (
        <Tab.Screen
          key={product.id}
          name={product.name}
          component={product.component}
          options={{
            tabBarLabel: product.name,
            tabBarIcon: ({ color, focused }) => renderTabIcon(product.icon, color, focused),
            tabBarAccessibilityLabel: `${product.name} - ${product.description}`,
          }}
        />
      ))}

      {/* Profile - Always available */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => renderTabIcon('person', color, focused),
          tabBarAccessibilityLabel: 'User Profile and Settings',
        }}
      />

      {/* Debug Screen - Only in development */}
      {__DEV__ && (
        <Tab.Screen
          name="Debug"
          component={SyncDebugScreen}
          options={{
            tabBarLabel: 'Debug',
            tabBarIcon: ({ color, focused }) => renderTabIcon('bug', color, focused),
            tabBarAccessibilityLabel: 'Debug and Sync Information',
            tabBarBadge: 'DEV',
            tabBarBadgeStyle: {
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: 8,
            },
          }}
        />
      )}
    </Tab.Navigator>
  );
};

export default DashboardNavigator;