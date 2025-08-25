import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Guard Screens
import GuardDashboardScreen from '../screens/guard/GuardDashboardScreen';
import GuardCheckInScreen from '../screens/guard/GuardCheckInScreen';
import IncidentReportScreen from '../screens/guard/IncidentReportScreen';
import PatrolSessionScreen from '../screens/guard/PatrolSessionScreen';
import GuardKPIScreen from '../screens/guard/GuardKPIScreen';
import SitesScreen from '../screens/guard/SitesScreen';

const Stack = createStackNavigator();

const GuardNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f9fafb' },
      }}
      initialRouteName="GuardDashboard"
    >
      <Stack.Screen 
        name="GuardDashboard" 
        component={GuardDashboardScreen}
        options={{ title: 'Guard Dashboard' }}
      />
      
      <Stack.Screen 
        name="GuardCheckIn" 
        component={GuardCheckInScreen}
        options={{ title: 'Check In' }}
      />
      
      <Stack.Screen 
        name="IncidentReport" 
        component={IncidentReportScreen}
        options={{ title: 'Report Incident' }}
      />
      
      <Stack.Screen 
        name="PatrolSession" 
        component={PatrolSessionScreen}
        options={{ title: 'Patrol Session' }}
      />
      
      <Stack.Screen 
        name="GuardKPI" 
        component={GuardKPIScreen}
        options={{ title: 'My Performance' }}
      />
      
      <Stack.Screen 
        name="Sites" 
        component={SitesScreen}
        options={{ title: 'Sites' }}
      />
    </Stack.Navigator>
  );
};

export default GuardNavigator;