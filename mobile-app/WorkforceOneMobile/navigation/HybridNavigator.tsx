import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen'
import AttendanceScreen from '../screens/AttendanceScreen'
import DailyCallsScreen from '../screens/DailyCallsScreen'
import TasksScreen from '../screens/TasksScreen'
import LeaveScreen from '../screens/LeaveScreen'
import FormsScreenSimple from '../screens/FormsScreenSimple'
import PayslipsScreen from '../screens/PayslipsScreen'
import SummaryScreen from '../screens/SummaryScreen'

const Drawer = createDrawerNavigator()
const Tab = createBottomTabNavigator()

// Custom Drawer Content for additional pages
function CustomDrawerContent(props: any) {
  const { profile, signOut } = useAuth()
  const insets = useSafeAreaInsets()

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error) {
              console.error('Error signing out:', error)
              Alert.alert('Error', 'Failed to sign out')
            }
          }
        }
      ]
    )
  }

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={[styles.drawerContent, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={32} color="white" />
          </View>
          <Text style={styles.profileName}>
            {profile?.full_name || 'User'}
          </Text>
          <Text style={styles.profileRole}>
            {profile?.role || 'Employee'}
          </Text>
        </View>

        {/* Main Navigation Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Navigation</Text>
        </View>
        
        {/* Main menu items */}
        <DrawerItem
          label="Home"
          icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate('MainTabs', { screen: 'Dashboard' })}
          activeTintColor="#3b82f6"
          inactiveTintColor="#6b7280"
        />
        
        <DrawerItem
          label="Summary"
          icon={({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate('Summary')}
          activeTintColor="#3b82f6"
          inactiveTintColor="#6b7280"
        />
        
        <DrawerItem
          label="Daily Calls"
          icon={({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate('DailyCalls')}
          activeTintColor="#3b82f6"
          inactiveTintColor="#6b7280"
        />

        {/* HR Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>HR</Text>
        </View>
        
        <DrawerItem
          label="Leave Requests"
          icon={({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate('Leave')}
          activeTintColor="#3b82f6"
          inactiveTintColor="#6b7280"
        />
        
        <DrawerItem
          label="Payslips"
          icon={({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate('Payslips')}
          activeTintColor="#3b82f6"
          inactiveTintColor="#6b7280"
        />
        
        {/* Spacer to push sign out button to bottom */}
        <View style={{ flex: 1 }} />
      </DrawerContentScrollView>

      {/* Sign Out Button - Fixed at bottom with safe area */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Bottom Tab Navigator for main functions
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
            case 'Forms':
              iconName = focused ? 'clipboard' : 'clipboard-outline'
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
          fontSize: 11,
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
        name="Forms" 
        component={FormsScreenSimple} 
        options={{ title: 'Forms' }}
      />
    </Tab.Navigator>
  )
}

// Main Drawer Navigator
export default function HybridNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: '#f9fafb',
          width: 280,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={{ paddingLeft: 16 }}
          >
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          title: 'WorkforceOne',
        }}
      />
      <Drawer.Screen
        name="Summary"
        component={SummaryScreen}
        options={{ title: 'Summary' }}
      />
      <Drawer.Screen
        name="DailyCalls"
        component={DailyCallsScreen}
        options={{ title: 'Daily Calls' }}
      />
      <Drawer.Screen
        name="Leave"
        component={LeaveScreen}
        options={{ title: 'Leave Requests' }}
      />
      <Drawer.Screen
        name="Payslips"
        component={PayslipsScreen}
        options={{ title: 'Payslips' }}
      />
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  drawerContent: {
    paddingTop: 0,
    minHeight: '100%',
  },
  profileSection: {
    backgroundColor: '#3b82f6',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileRole: {
    color: '#93c5fd',
    fontSize: 14,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
})