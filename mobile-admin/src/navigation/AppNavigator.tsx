import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { Config } from '../config/config'

// Screens
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import OrganizationsScreen from '../screens/OrganizationsScreen'
import UsersScreen from '../screens/UsersScreen'
import AnalyticsScreen from '../screens/AnalyticsScreen'
import MonitoringScreen from '../screens/MonitoringScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function MainTabs() {
  const insets = useSafeAreaInsets()
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline'
              break
            case 'Organizations':
              iconName = focused ? 'business' : 'business-outline'
              break
            case 'Users':
              iconName = focused ? 'people' : 'people-outline'
              break
            case 'Monitoring':
              iconName = focused ? 'pulse' : 'pulse-outline'
              break
            case 'Analytics':
              iconName = focused ? 'analytics' : 'analytics-outline'
              break
            default:
              iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: Config.app.theme.primary,
        tabBarInactiveTintColor: Config.app.theme.textSecondary,
        tabBarStyle: {
          backgroundColor: Config.app.theme.surface,
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 8), // Use actual safe area bottom or minimum 8
          paddingTop: 8,
          height: 80 + Math.max(insets.bottom, 0), // Base height + safe area
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Organizations" 
        component={OrganizationsScreen}
        options={{
          title: 'Organizations',
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={UsersScreen}
        options={{
          title: 'Users',
        }}
      />
      <Tab.Screen 
        name="Monitoring" 
        component={MonitoringScreen}
        options={{
          title: 'Monitoring',
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null // You could add a loading screen here
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}