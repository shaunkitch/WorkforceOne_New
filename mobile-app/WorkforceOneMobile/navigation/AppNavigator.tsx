import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../contexts/AuthContext'
import LoginScreen from '../screens/auth/LoginScreen'
import SignupScreen from '../screens/auth/SignupScreen'
import DashboardScreen from '../screens/dashboard/DashboardScreen'
import AttendanceScreen from '../screens/AttendanceScreen'
import DailyCallsScreen from '../screens/DailyCallsScreen'
import TasksScreen from '../screens/TasksScreen'
import LeaveScreen from '../screens/LeaveScreen'
import FormsScreen from '../screens/FormsScreen'
import FormCompletionScreen from '../screens/FormCompletionScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  )
}

function MainTabs() {
  const insets = useSafeAreaInsets()
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Attendance':
              iconName = focused ? 'time' : 'time-outline'
              break
            case 'Tasks':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline'
              break
            case 'DailyCalls':
              iconName = focused ? 'map' : 'map-outline'
              break
            case 'Leave':
              iconName = focused ? 'calendar' : 'calendar-outline'
              break
            default:
              iconName = 'ellipse-outline'
          }

          return <Ionicons name={iconName as any} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
        tabBarLabelStyle: { 
          fontSize: 10,
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 8,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Attendance" 
        component={AttendanceScreen} 
        options={{ title: 'Clock In' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{ title: 'My Tasks' }}
      />
      <Tab.Screen 
        name="DailyCalls" 
        component={DailyCallsScreen} 
        options={{ title: 'Daily Calls' }}
      />
      <Tab.Screen 
        name="Leave" 
        component={LeaveScreen} 
        options={{ title: 'Leave' }}
      />
    </Tab.Navigator>
  )
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="FormCompletion" 
        component={FormCompletionScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true
        }}
      />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // You could add a loading screen here
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}