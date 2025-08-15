import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import { useAuth } from '../contexts/AuthContext'
import LoginScreen from '../screens/auth/LoginScreen'
import SignupScreen from '../screens/auth/SignupScreen'
import HybridNavigator from './HybridNavigator'
import FormCompletionScreen from '../screens/FormCompletionScreen'

const Stack = createStackNavigator()

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  )
}

function MainApp() {
  return <HybridNavigator />
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainApp} />
      <Stack.Screen 
        name="FormCompletion" 
        component={FormCompletionScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          headerShown: true,
          headerTitle: 'Complete Form',
          headerStyle: { backgroundColor: '#3b82f6' },
          headerTintColor: 'white'
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