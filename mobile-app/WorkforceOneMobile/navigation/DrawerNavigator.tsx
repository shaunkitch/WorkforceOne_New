import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags } from '../hooks/useFeatureFlags'

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen'
import AttendanceScreen from '../screens/AttendanceScreen'
import DailyCallsScreen from '../screens/DailyCallsScreen'
import TasksScreen from '../screens/TasksScreen'
import LeaveScreen from '../screens/LeaveScreen'
import FormsScreen from '../screens/FormsScreen'
import PayslipsScreen from '../screens/PayslipsScreen'

const Drawer = createDrawerNavigator()

interface DrawerItem {
  name: string
  label: string
  icon: string
  component: React.ComponentType<any>
  section?: string
}

const drawerItems: DrawerItem[] = [
  // Main Navigation
  { name: 'Dashboard', label: 'Home', icon: 'home-outline', component: DashboardScreen },
  { name: 'Attendance', label: 'Clock In/Out', icon: 'time-outline', component: AttendanceScreen },
  { name: 'Tasks', label: 'My Tasks', icon: 'checkmark-circle-outline', component: TasksScreen },
  { name: 'DailyCalls', label: 'Daily Calls', icon: 'map-outline', component: DailyCallsScreen },
  
  // HR Section
  { name: 'Leave', label: 'Leave Requests', icon: 'calendar-outline', component: LeaveScreen, section: 'HR' },
  { name: 'Payslips', label: 'Payslips', icon: 'document-text-outline', component: PayslipsScreen, section: 'HR' },
  
  // Forms Section
  { name: 'Forms', label: 'Forms', icon: 'clipboard-outline', component: FormsScreen, section: 'Other' },
]

function CustomDrawerContent(props: any) {
  const { profile, signOut } = useAuth()
  const { hasFeature } = useFeatureFlags()
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

  // Filter items based on feature flags
  const filterItemsByFeatures = (items: DrawerItem[]) => {
    return items.filter(item => {
      // Check if Daily Calls should be shown based on feature flags
      if (item.name === 'DailyCalls') {
        return hasFeature('maps') // This checks both organization setting and user work type
      }
      
      // Add more feature checks here for other items if needed
      if (item.name === 'Tasks') {
        return hasFeature('tasks')
      }
      
      if (item.name === 'Leave') {
        return hasFeature('leave')
      }
      
      if (item.name === 'Forms') {
        return hasFeature('forms')
      }
      
      // Default to showing the item if no specific feature check
      return true
    })
  }

  // Group items by section and filter by features
  const mainItems = filterItemsByFeatures(drawerItems.filter(item => !item.section))
  const hrItems = filterItemsByFeatures(drawerItems.filter(item => item.section === 'HR'))
  const otherItems = filterItemsByFeatures(drawerItems.filter(item => item.section === 'Other'))

  const renderDrawerItem = (item: DrawerItem) => (
    <DrawerItem
      key={item.name}
      label={item.label}
      icon={({ color, size }) => (
        <Ionicons name={item.icon as any} size={size} color={color} />
      )}
      onPress={() => props.navigation.navigate(item.name)}
      activeTintColor="#3b82f6"
      inactiveTintColor="#6b7280"
      style={styles.drawerItem}
      labelStyle={styles.drawerLabel}
    />
  )

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  )

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

        {/* Main Navigation */}
        <View style={styles.navigationSection}>
          {mainItems.map(renderDrawerItem)}
        </View>

        {/* HR Section */}
        {renderSectionHeader('HR')}
        <View style={styles.navigationSection}>
          {hrItems.map(renderDrawerItem)}
        </View>

        {/* Other Section */}
        {renderSectionHeader('Other')}
        <View style={styles.navigationSection}>
          {otherItems.map(renderDrawerItem)}
        </View>

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

export default function DrawerNavigator() {
  const { hasFeature } = useFeatureFlags()
  
  // Filter drawer items based on feature flags for screen registration
  const getFilteredDrawerItems = () => {
    return drawerItems.filter(item => {
      if (item.name === 'DailyCalls') {
        return hasFeature('maps')
      }
      if (item.name === 'Tasks') {
        return hasFeature('tasks')
      }
      if (item.name === 'Leave') {
        return hasFeature('leave')
      }
      if (item.name === 'Forms') {
        return hasFeature('forms')
      }
      return true
    })
  }

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
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
        drawerActiveTintColor: '#3b82f6',
        drawerInactiveTintColor: '#6b7280',
        drawerType: 'slide',
      }}
    >
      {getFilteredDrawerItems().map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={item.component}
          options={{
            title: item.label,
            drawerIcon: ({ color, size }) => (
              <Ionicons name={item.icon as any} size={size} color={color} />
            ),
          }}
        />
      ))}
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
  navigationSection: {
    marginBottom: 8,
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
  drawerItem: {
    marginHorizontal: 12,
    borderRadius: 8,
    paddingVertical: 4,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: -20,
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