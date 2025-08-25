import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface GuardDashboardScreenProps {
  navigation: any;
}

interface ShiftStatus {
  isOnDuty: boolean;
  shiftStart?: Date;
  currentLocation?: string;
  patrolsCompleted: number;
  incidentsReported: number;
}

const GuardDashboardScreen: React.FC<GuardDashboardScreenProps> = ({ navigation }) => {
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus>({
    isOnDuty: false,
    patrolsCompleted: 0,
    incidentsReported: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState('Guard');

  useEffect(() => {
    loadUserData();
    loadShiftStatus();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(' ')[0]); // First name only
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadShiftStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem('shiftStatus');
      if (stored) {
        const status = JSON.parse(stored);
        setShiftStatus({
          ...status,
          shiftStart: status.shiftStart ? new Date(status.shiftStart) : undefined
        });
      }
    } catch (error) {
      console.error('Error loading shift status:', error);
    }
  };

  const saveShiftStatus = async (status: ShiftStatus) => {
    try {
      await AsyncStorage.setItem('shiftStatus', JSON.stringify(status));
      setShiftStatus(status);
    } catch (error) {
      console.error('Error saving shift status:', error);
    }
  };

  const toggleShift = () => {
    if (shiftStatus.isOnDuty) {
      // End shift
      Alert.alert(
        "End Shift",
        "Are you sure you want to end your shift?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End Shift",
            style: "destructive",
            onPress: () => {
              saveShiftStatus({
                isOnDuty: false,
                patrolsCompleted: 0,
                incidentsReported: 0
              });
            }
          }
        ]
      );
    } else {
      // Start shift
      Alert.alert(
        "Start Shift",
        "Ready to start your shift?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start Shift",
            onPress: () => {
              saveShiftStatus({
                isOnDuty: true,
                shiftStart: new Date(),
                currentLocation: "Security Office",
                patrolsCompleted: 0,
                incidentsReported: 0
              });
            }
          }
        ]
      );
    }
  };

  const getShiftDuration = () => {
    if (!shiftStatus.isOnDuty || !shiftStatus.shiftStart) return "Not on duty";
    
    const now = new Date();
    const diffMs = now.getTime() - shiftStatus.shiftStart.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const primaryActions = [
    {
      id: 'checkin',
      title: 'Check In',
      subtitle: 'Scan QR or manual entry',
      icon: 'location',
      color: '#2563eb',
      onPress: () => navigation.navigate('GuardCheckIn')
    },
    {
      id: 'patrol',
      title: 'Start Patrol',
      subtitle: 'Begin patrol session',
      icon: 'walk',
      color: '#059669',
      onPress: () => navigation.navigate('PatrolSession'),
      disabled: !shiftStatus.isOnDuty
    },
    {
      id: 'incident',
      title: 'Report Incident',
      subtitle: 'Document security incident',
      icon: 'alert-circle',
      color: '#dc2626',
      onPress: () => navigation.navigate('IncidentReport')
    },
    {
      id: 'emergency',
      title: 'EMERGENCY',
      subtitle: 'Call for immediate help',
      icon: 'warning',
      color: '#dc2626',
      isEmergency: true,
      onPress: () => {
        Alert.alert(
          "EMERGENCY",
          "This will immediately alert your supervisor and security team.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "SEND ALERT",
              style: "destructive",
              onPress: () => {
                // TODO: Implement emergency alert
                Alert.alert("Emergency Alert Sent", "Help is on the way!");
              }
            }
          ]
        );
      }
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      
      {/* Header with shift status */}
      <LinearGradient
        colors={shiftStatus.isOnDuty ? ['#059669', '#047857'] : ['#1f2937', '#374151']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {userName}</Text>
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.shiftButton,
              { backgroundColor: shiftStatus.isOnDuty ? '#dc2626' : '#059669' }
            ]}
            onPress={toggleShift}
          >
            <Text style={styles.shiftButtonText}>
              {shiftStatus.isOnDuty ? 'End Shift' : 'Start Shift'}
            </Text>
          </TouchableOpacity>
        </View>

        {shiftStatus.isOnDuty && (
          <View style={styles.shiftInfo}>
            <View style={styles.shiftDetail}>
              <Text style={styles.shiftLabel}>On Duty</Text>
              <Text style={styles.shiftValue}>{getShiftDuration()}</Text>
            </View>
            <View style={styles.shiftDetail}>
              <Text style={styles.shiftLabel}>Location</Text>
              <Text style={styles.shiftValue}>{shiftStatus.currentLocation || 'Unknown'}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Today's Stats - Only show when on duty */}
        {shiftStatus.isOnDuty && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Today's Activity</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{shiftStatus.patrolsCompleted}</Text>
                <Text style={styles.statLabel}>Patrols</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{shiftStatus.incidentsReported}</Text>
                <Text style={styles.statLabel}>Incidents</Text>
              </View>
            </View>
          </View>
        )}

        {/* Primary Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {primaryActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionCard,
                action.isEmergency && styles.emergencyCard,
                action.disabled && styles.disabledCard
              ]}
              onPress={action.disabled ? undefined : action.onPress}
              disabled={action.disabled}
            >
              <View style={styles.actionContent}>
                <View style={[
                  styles.actionIconContainer,
                  { backgroundColor: action.color + '20' }
                ]}>
                  <Ionicons 
                    name={action.icon as any} 
                    size={28} 
                    color={action.disabled ? '#9ca3af' : action.color} 
                  />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={[
                    styles.actionTitle,
                    action.isEmergency && styles.emergencyTitle,
                    action.disabled && styles.disabledText
                  ]}>
                    {action.title}
                  </Text>
                  <Text style={[
                    styles.actionSubtitle,
                    action.disabled && styles.disabledText
                  ]}>
                    {action.disabled ? 'Start shift first' : action.subtitle}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={action.disabled ? '#9ca3af' : '#6b7280'} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats Access */}
        <TouchableOpacity
          style={styles.statsAccessCard}
          onPress={() => navigation.navigate('GuardKPI')}
        >
          <View style={styles.actionContent}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="bar-chart" size={28} color="#7c3aed" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>My Performance</Text>
              <Text style={styles.actionSubtitle}>View your daily targets and stats</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: '#d1d5db',
  },
  shiftButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shiftButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  shiftInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  shiftDetail: {
    alignItems: 'center',
  },
  shiftLabel: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 4,
  },
  shiftValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  disabledCard: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  emergencyTitle: {
    color: '#dc2626',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  disabledText: {
    color: '#9ca3af',
  },
  statsAccessCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default GuardDashboardScreen;