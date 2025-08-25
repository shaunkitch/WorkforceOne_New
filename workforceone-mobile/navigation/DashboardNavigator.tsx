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
import { getCurrentUserProfile, hasProductAccess, hasFeatureAccess, getEnabledFeatures, FeatureAccess } from '../lib/rbac';

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
  const [enabledFeatures, setEnabledFeatures] = useState<FeatureAccess>({});
  const [loading, setLoading] = useState(!propUserProducts.length);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!propUserProducts.length) {
      loadUserProductsAndFeatures();
    }
  }, [propUserProducts.length]);

  const loadUserProductsAndFeatures = async () => {
    try {
      // Use RBAC system to get user profile and products
      const userProfile = await getCurrentUserProfile();
      if (!userProfile) {
        setLoading(false);
        return;
      }

      // Convert role-based products to UserProduct format for compatibility
      const roleBasedProducts: UserProduct[] = userProfile.permissions.products.map(productId => ({
        id: `rbac-${productId}`,
        product_id: productId,
        is_active: true
      }));

      // Get organization's enabled features
      const features = await getEnabledFeatures();

      setUserProducts(roleBasedProducts);
      setEnabledFeatures(features);

      console.log('User products from RBAC:', roleBasedProducts);
      console.log('Enabled features:', features);
    } catch (error) {
      console.error('Error loading user products and features:', error);
    } finally {
      setLoading(false);
    }
  };

  // Define available products with enhanced metadata and feature checking
  const availableProducts = [
    {
      id: 'workforce-management',
      name: 'Workforce',
      icon: 'people',
      component: WorkforceDashboardScreen,
      description: 'Team management',
      requiredFeatures: ['mobile_workforce_product', 'workforce_management'] // Check main product toggle first
    },
    {
      id: 'time-tracker',
      name: 'Time',
      icon: 'time',
      component: TimeDashboardScreen,
      description: 'Time tracking',
      requiredFeatures: ['mobile_time_product', 'time_tracking'] // Check main product toggle first
    },
    {
      id: 'guard-management',
      name: 'Guard',
      icon: 'shield-checkmark',
      component: GuardNavigator,
      description: 'Security guard tools',
      requiredFeatures: ['mobile_guard_product', 'guard_management'] // Check main product toggle first
    }
  ];

  // Filter products based on user access AND feature availability
  const accessibleProducts = availableProducts.filter(product => {
    // Check if user has product access via RBAC
    const hasProductAccess = userProducts.some(up => up.product_id === product.id);
    
    // Check if organization has required features enabled
    // ALL required features must be enabled (includes main product toggle + specific features)
    const hasRequiredFeatures = product.requiredFeatures.every(feature => 
      enabledFeatures[feature] === true
    );
    
    console.log(`Product ${product.name}: RBAC=${hasProductAccess}, Features=${hasRequiredFeatures}`, {
      requiredFeatures: product.requiredFeatures,
      enabledFeatures: enabledFeatures
    });
    
    return hasProductAccess && hasRequiredFeatures;
  });

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
      initialRouteName="Home"
    >
      {/* Main Dashboard - Always available */}
      <Tab.Screen
        name="Home"
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