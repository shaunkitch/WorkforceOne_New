import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import PatrolSessionScreen from '../screens/guard/PatrolSessionScreen';
import IncidentReportScreen from '../screens/guard/IncidentReportScreen';
import GuardKPIScreen from '../screens/guard/GuardKPIScreen';
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
  PatrolSession: undefined;
  Incidents: undefined;
  IncidentReport: { fromPatrol?: boolean };
  GuardKPI: undefined;
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
        headerShown: false
      }}
    >
      <WorkforceStack.Screen 
        name="WorkforceDashboard" 
        component={WorkforceDashboardScreen}
      />
      <WorkforceStack.Screen 
        name="Projects" 
        component={ProjectsScreen}
      />
    </WorkforceStack.Navigator>
  );
}

function TimeNavigator() {
  return (
    <TimeStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <TimeStack.Screen 
        name="TimeDashboard" 
        component={TimeDashboardScreen}
      />
      <TimeStack.Screen 
        name="Timer" 
        component={TimerScreen}
      />
      <TimeStack.Screen 
        name="Timesheet" 
        component={TimesheetScreen}
      />
    </TimeStack.Navigator>
  );
}

function GuardNavigator() {
  return (
    <GuardStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <GuardStack.Screen 
        name="GuardDashboard" 
        component={GuardDashboardScreen}
      />
      <GuardStack.Screen 
        name="Sites" 
        component={SitesScreen}
      />
      <GuardStack.Screen 
        name="CheckIn" 
        component={CheckInScreen}
      />
      <GuardStack.Screen 
        name="GuardCheckIn" 
        component={GuardCheckInScreen}
      />
      <GuardStack.Screen 
        name="PatrolSession" 
        component={PatrolSessionScreen}
      />
      <GuardStack.Screen 
        name="IncidentReport" 
        component={IncidentReportScreen}
      />
      <GuardStack.Screen 
        name="GuardKPI" 
        component={GuardKPIScreen}
      />
    </GuardStack.Navigator>
  );
}

export default function DashboardNavigator({ userProducts, onSignOut }: Props) {
  const availableProducts = getAvailableProducts(userProducts);
  const primaryProduct = getPrimaryProduct(userProducts);
  const insets = useSafeAreaInsets();
  
  console.log('DashboardNavigator - userProducts:', userProducts);
  console.log('DashboardNavigator - availableProducts:', availableProducts.map(p => p.id));
  
  const tabBarOptions = {
    activeTintColor: primaryProduct?.color.primary || '#3b82f6',
    inactiveTintColor: '#6b7280',
    style: {
      backgroundColor: '#fff',
      borderTopColor: '#e5e7eb',
      borderTopWidth: 1,
      paddingBottom: Math.max(insets.bottom, 5),
      paddingTop: 8,
      height: 60 + Math.max(insets.bottom, 5),
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    labelStyle: {
      fontSize: 11,
      fontWeight: '600' as const,
      marginBottom: 2,
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