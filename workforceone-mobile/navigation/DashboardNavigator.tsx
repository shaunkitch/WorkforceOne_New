import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { getAvailableProducts, getPrimaryProduct } from '../lib/products';
import UnifiedDashboardScreen from '../screens/UnifiedDashboardScreen';
import WorkforceDashboardScreen from '../screens/workforce/WorkforceDashboardScreen';
import ProjectsScreen from '../screens/workforce/ProjectsScreen';
import TimeDashboardScreen from '../screens/time/TimeDashboardScreen';
import TimerScreen from '../screens/time/TimerScreen';
import TimesheetScreen from '../screens/time/TimesheetScreen';
import GuardDashboardScreen from '../screens/guard/GuardDashboardScreen';
import SitesScreen from '../screens/guard/SitesScreen';
import CheckInScreen from '../screens/guard/CheckInScreen';
import GuardCheckInScreen from '../screens/guard/GuardCheckInScreen';
import IncidentReportScreen from '../screens/guard/IncidentReportScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type DashboardTabParamList = {
  Home: undefined;
  Workforce: undefined;
  TimeTracker: undefined;
  Guard: undefined;
  Profile: undefined;
};

export type WorkforceStackParamList = {
  WorkforceDashboard: undefined;
  Projects: undefined;
  Employees: undefined;
  Teams: undefined;
  Analytics: undefined;
};

export type TimeStackParamList = {
  TimeDashboard: undefined;
  Timer: undefined;
  Timesheet: undefined;
  Reports: undefined;
  Invoices: undefined;
};

export type GuardStackParamList = {
  GuardDashboard: undefined;
  Sites: undefined;
  Guards: undefined;
  CheckIn: undefined;
  GuardCheckIn: undefined;
  Incidents: undefined;
  IncidentReport: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();
const WorkforceStack = createStackNavigator<WorkforceStackParamList>();
const TimeStack = createStackNavigator<TimeStackParamList>();
const GuardStack = createStackNavigator<GuardStackParamList>();

interface Props {
  userProducts: string[];
  onSignOut: () => void;
}

// Stack Navigators
function WorkforceNavigator() {
  return (
    <WorkforceStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#059669' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <WorkforceStack.Screen 
        name="WorkforceDashboard" 
        component={WorkforceDashboardScreen}
        options={{ headerTitle: 'Workforce Management' }}
      />
      <WorkforceStack.Screen 
        name="Projects" 
        component={ProjectsScreen}
        options={{ headerTitle: 'Projects' }}
      />
    </WorkforceStack.Navigator>
  );
}

function TimeNavigator() {
  return (
    <TimeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#3b82f6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <TimeStack.Screen 
        name="TimeDashboard" 
        component={TimeDashboardScreen}
        options={{ headerTitle: 'Time Tracker' }}
      />
      <TimeStack.Screen 
        name="Timer" 
        component={TimerScreen}
        options={{ headerTitle: 'Timer' }}
      />
      <TimeStack.Screen 
        name="Timesheet" 
        component={TimesheetScreen}
        options={{ headerTitle: 'Timesheet' }}
      />
    </TimeStack.Navigator>
  );
}

function GuardNavigator() {
  return (
    <GuardStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#7c3aed' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <GuardStack.Screen 
        name="GuardDashboard" 
        component={GuardDashboardScreen}
        options={{ headerTitle: 'Guard Management' }}
      />
      <GuardStack.Screen 
        name="Sites" 
        component={SitesScreen}
        options={{ headerTitle: 'Sites' }}
      />
      <GuardStack.Screen 
        name="CheckIn" 
        component={CheckInScreen}
        options={{ headerTitle: 'Check In' }}
      />
      <GuardStack.Screen 
        name="GuardCheckIn" 
        component={GuardCheckInScreen}
        options={{ headerTitle: 'Guard Check-In System' }}
      />
      <GuardStack.Screen 
        name="IncidentReport" 
        component={IncidentReportScreen}
        options={{ headerTitle: 'Report Incident' }}
      />
    </GuardStack.Navigator>
  );
}

export default function DashboardNavigator({ userProducts, onSignOut }: Props) {
  const availableProducts = getAvailableProducts(userProducts);
  const primaryProduct = getPrimaryProduct(userProducts);
  
  const tabBarOptions = {
    activeTintColor: primaryProduct?.color.primary || '#3b82f6',
    inactiveTintColor: '#6b7280',
    style: {
      backgroundColor: '#fff',
      borderTopColor: '#e5e7eb',
      paddingBottom: 5,
      height: 60,
    },
    labelStyle: {
      fontSize: 12,
      fontWeight: '600' as const,
    },
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarOptions.activeTintColor,
        tabBarInactiveTintColor: tabBarOptions.inactiveTintColor,
        tabBarStyle: tabBarOptions.style,
        tabBarLabelStyle: tabBarOptions.labelStyle,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      >
        {(props) => (
          <UnifiedDashboardScreen {...props} userProducts={userProducts} />
        )}
      </Tab.Screen>

      {availableProducts.some(p => p.id === 'workforce-management') && (
        <Tab.Screen
          name="Workforce"
          component={WorkforceNavigator}
          options={{
            tabBarLabel: 'Workforce',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text>,
          }}
        />
      )}

      {availableProducts.some(p => p.id === 'time-tracker') && (
        <Tab.Screen
          name="TimeTracker"
          component={TimeNavigator}
          options={{
            tabBarLabel: 'Time',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⏱️</Text>,
          }}
        />
      )}

      {availableProducts.some(p => p.id === 'guard-management') && (
        <Tab.Screen
          name="Guard"
          component={GuardNavigator}
          options={{
            tabBarLabel: 'Security',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🛡️</Text>,
          }}
        />
      )}

      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      >
        {(props) => (
          <ProfileScreen {...props} onSignOut={onSignOut} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}