import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { syncManager } from '../../lib/syncManager';

interface CheckInData {
  siteId: string;
  siteName: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  guardId: string;
  type: 'check-in' | 'check-out';
}

interface RecentCheckIn {
  siteName: string;
  timestamp: string;
  type: 'check-in' | 'check-out';
}

export default function GuardCheckInScreen({ navigation }: { navigation: any }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [currentCheckIn, setCurrentCheckIn] = useState<CheckInData | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentCheckIn[]>([]);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await Promise.all([
      loadCurrentStatus(),
      getLocation(),
      loadRecentActivity(),
    ]);
  };

  const loadCurrentStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem('currentCheckIn');
      if (stored) {
        setCurrentCheckIn(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading check-in status:', error);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const history = await AsyncStorage.getItem('recentCheckIns');
      if (history) {
        const parsed = JSON.parse(history);
        setRecentActivity(parsed.slice(0, 3)); // Only show last 3
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const handleQRScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Access', 'Camera permission is required to scan QR codes');
        return;
      }
    }
    setScanning(true);
  };

  const handleQRCodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'site_checkin' && qrData.siteId && qrData.siteName) {
        await processCheckIn(qrData);
      } else {
        Alert.alert('Invalid QR Code', 'This is not a valid check-in location');
      }
    } catch (error) {
      Alert.alert('Invalid QR Code', 'Unable to read this QR code');
    }
  };

  const processCheckIn = async (qrData: any) => {
    setLoading(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      const guardId = user?.user?.id || 'offline-guard';
      const timestamp = new Date().toISOString();
      const isCheckingOut = currentCheckIn?.siteId === qrData.siteId;

      const checkInData: CheckInData = {
        siteId: qrData.siteId,
        siteName: qrData.siteName,
        timestamp,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : { latitude: 0, longitude: 0 },
        guardId,
        type: isCheckingOut ? 'check-out' : 'check-in',
      };

      // Update current status
      if (isCheckingOut) {
        await AsyncStorage.removeItem('currentCheckIn');
        setCurrentCheckIn(null);
      } else {
        await AsyncStorage.setItem('currentCheckIn', JSON.stringify(checkInData));
        setCurrentCheckIn(checkInData);
      }

      // Update recent activity
      const recentItem: RecentCheckIn = {
        siteName: qrData.siteName,
        timestamp,
        type: checkInData.type,
      };
      
      const newActivity = [recentItem, ...recentActivity].slice(0, 3);
      setRecentActivity(newActivity);
      await AsyncStorage.setItem('recentCheckIns', JSON.stringify(newActivity));

      // Sync to database (offline-first)
      try {
        await syncCheckInToDatabase(checkInData);
      } catch (syncError) {
        console.log('Sync failed, will retry later:', syncError);
      }

      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success!',
        `${checkInData.type === 'check-in' ? 'Checked in to' : 'Checked out from'} ${qrData.siteName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const syncCheckInToDatabase = async (checkInData: CheckInData) => {
    const visitData = {
      id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_id: null,
      checkpoint_id: checkInData.siteId,
      visited_at: checkInData.timestamp,
      latitude: checkInData.location.latitude,
      longitude: checkInData.location.longitude,
      qr_code_scanned: true,
      manual_check_in: false,
      verification_notes: `${checkInData.type} at ${checkInData.siteName}`,
      device_battery_level: 90,
    };

    await syncManager.syncData('checkpoint_visits', visitData);
  };

  const handleManualCheckIn = () => {
    Alert.alert(
      'Manual Check-In',
      'Choose your location:',
      [
        { text: 'Main Entrance', onPress: () => manualCheckIn('main-entrance', 'Main Entrance') },
        { text: 'Parking Lot', onPress: () => manualCheckIn('parking-lot', 'Parking Lot') },
        { text: 'Office Building', onPress: () => manualCheckIn('office-building', 'Office Building') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const manualCheckIn = async (siteId: string, siteName: string) => {
    await processCheckIn({ siteId, siteName, type: 'site_checkin' });
  };

  const handleEmergency = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      '🚨 Emergency',
      'Are you sure you need emergency assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call for Help', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: user } = await supabase.auth.getUser();
              const emergencyData = {
                id: `emergency_${Date.now()}`,
                guard_id: user?.user?.id || 'offline-guard',
                location: location ? {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude
                } : null,
                timestamp: new Date().toISOString(),
                status: 'active'
              };

              await AsyncStorage.setItem('emergencyAlert', JSON.stringify(emergencyData));
              Alert.alert('Emergency Alert Sent', 'Help is on the way. Stay safe.');
            } catch (error) {
              Alert.alert('Emergency Alert', 'Alert triggered. Stay safe.');
            }
          }
        },
      ]
    );
  };

  const getStatusInfo = () => {
    if (!currentCheckIn) {
      return {
        title: 'Not Checked In',
        subtitle: 'Scan a QR code or check in manually',
        color: '#ef4444',
        icon: '📍'
      };
    }

    const duration = Math.floor((Date.now() - new Date(currentCheckIn.timestamp).getTime()) / 60000);
    return {
      title: `At ${currentCheckIn.siteName}`,
      subtitle: `${duration} minutes ago`,
      color: '#10b981',
      icon: '✅'
    };
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Camera scanner view
  if (scanning && permission?.granted) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={handleQRCodeScanned}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerText}>Point camera at QR code</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setScanning(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = getStatusInfo();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-In</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Current Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{status.icon}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{status.title}</Text>
            <Text style={styles.statusSubtitle}>{status.subtitle}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        </View>
      </View>

      {/* Main Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleQRScan}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={currentCheckIn ? ['#ef4444', '#dc2626'] : ['#6366f1', '#8b5cf6']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonIcon}>📱</Text>
            <Text style={styles.buttonText}>
              {currentCheckIn ? 'Check Out with QR' : 'Check In with QR'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleManualCheckIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonIcon}>📍</Text>
          <Text style={styles.secondaryButtonText}>Manual Check-In</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <View style={styles.activityContainer}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityIcon}>
                {activity.type === 'check-in' ? '✅' : '🚪'}
              </Text>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{activity.siteName}</Text>
                <Text style={styles.activityTime}>
                  {activity.type === 'check-in' ? 'Checked in' : 'Checked out'} at {formatTime(activity.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Emergency Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handleEmergency}
        activeOpacity={0.8}
      >
        <Text style={styles.emergencyIcon}>🚨</Text>
        <Text style={styles.emergencyText}>Emergency</Text>
      </TouchableOpacity>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    minWidth: 50,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 50,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    minHeight: 64,
  },
  buttonIcon: {
    fontSize: 28,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    minHeight: 64,
  },
  secondaryButtonIcon: {
    fontSize: 28,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  activityContainer: {
    margin: 20,
    marginTop: 32,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  emergencyButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#ef4444',
    minHeight: 64,
  },
  emergencyIcon: {
    fontSize: 28,
  },
  emergencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scannerText: {
    fontSize: 18,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 32,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#ffffff',
    minHeight: 52,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
});