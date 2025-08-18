import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import { patrolService, PatrolRoute, PatrolCheckpoint } from '../services/PatrolService';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

interface CheckpointVisit {
  checkpoint_id: string;
  visited_at: string;
  is_valid: boolean;
}

export default function PatrolCheckpointsScreen({ route, navigation }: any) {
  const patrolRoute: PatrolRoute = route.params.route;
  const [checkpointVisits, setCheckpointVisits] = useState<CheckpointVisit[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    loadCheckpointVisits();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const loadCheckpointVisits = async () => {
    try {
      const currentSession = patrolService.getCurrentSession();
      if (!currentSession) return;

      const { data: visits, error } = await supabase
        .from('checkpoint_visits')
        .select('checkpoint_id, visited_at, is_valid_visit')
        .eq('session_id', currentSession.id);

      if (error) {
        console.error('Error loading visits:', error);
        return;
      }

      setCheckpointVisits(
        (visits || []).map(visit => ({
          checkpoint_id: visit.checkpoint_id,
          visited_at: visit.visited_at,
          is_valid: visit.is_valid_visit,
        }))
      );
    } catch (error) {
      console.error('Error in loadCheckpointVisits:', error);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const openScanner = async (checkpoint: PatrolCheckpoint) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
      return;
    }

    setScannedData(null);
    setScanning(true);
    setShowScanner(true);
  };

  const handleBarCodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (!scanning) return;

    setScanning(false);
    setScannedData(scanningResult.data);

    try {
      // Try to parse as JSON (new QR code format)
      const qrData = JSON.parse(scanningResult.data);
      
      if (qrData.checkpoint_id && qrData.verification_code) {
        // New format with checkpoint data
        const matchingCheckpoint = patrolRoute.checkpoints.find(
          cp => cp.id === qrData.checkpoint_id
        );

        if (matchingCheckpoint) {
          // Verify location if current location is available
          if (currentLocation && qrData.latitude && qrData.longitude) {
            const distance = calculateDistance(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              qrData.latitude,
              qrData.longitude
            );
            
            // Allow 100m tolerance for location verification
            if (distance > 100) {
              Alert.alert(
                'Location Mismatch',
                `You are ${Math.round(distance)}m away from the checkpoint location. Please move closer to the checkpoint.`,
                [
                  {
                    text: 'Scan Again',
                    onPress: () => {
                      setScanning(true);
                      setScannedData(null);
                    },
                  },
                  { text: 'Cancel', onPress: () => setShowScanner(false) },
                ]
              );
              return;
            }
          }
          
          processCheckpointVisit(matchingCheckpoint, scanningResult.data, qrData.verification_code);
        } else {
          Alert.alert(
            'Wrong Route',
            'This checkpoint is not part of your current patrol route.',
            [
              {
                text: 'Scan Again',
                onPress: () => {
                  setScanning(true);
                  setScannedData(null);
                },
              },
              { text: 'Cancel', onPress: () => setShowScanner(false) },
            ]
          );
        }
      } else {
        throw new Error('Invalid QR format');
      }
    } catch (error) {
      // Fallback to old format
      const matchingCheckpoint = patrolRoute.checkpoints.find(
        cp => cp.qr_code === scanningResult.data
      );

      if (matchingCheckpoint) {
        processCheckpointVisit(matchingCheckpoint, scanningResult.data);
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not recognized. Please ensure you are scanning a valid checkpoint QR code.',
          [
            {
              text: 'Scan Again',
              onPress: () => {
                setScanning(true);
                setScannedData(null);
              },
            },
            { text: 'Cancel', onPress: () => setShowScanner(false) },
          ]
        );
      }
    }
  };

  const processCheckpointVisit = async (checkpoint: PatrolCheckpoint, qrData: string, verificationCode?: string) => {
    try {
      setShowScanner(false);

      const currentSession = patrolService.getCurrentSession();
      if (!currentSession) {
        Alert.alert('Error', 'No active patrol session found.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Calculate distance from checkpoint
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        checkpoint.latitude,
        checkpoint.longitude
      );

      const isWithinRange = distance <= checkpoint.radius_meters;
      const visitTime = new Date().toISOString();

      // Create checkpoint visit record
      const visitData = {
        session_id: currentSession.id,
        checkpoint_id: checkpoint.id,
        visited_at: visitTime,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        distance_from_checkpoint_meters: distance,
        qr_code_scanned: true,
        qr_scan_data: qrData,
        verification_code: verificationCode,
        is_valid_visit: isWithinRange,
        validation_flags: isWithinRange ? null : ['outside_radius'],
      };

      const { error } = await supabase
        .from('checkpoint_visits')
        .insert(visitData);

      if (error) {
        console.error('Error saving checkpoint visit:', error);
        Alert.alert('Error', 'Failed to record checkpoint visit.');
        return;
      }

      // Update local state
      setCheckpointVisits(prev => [
        ...prev.filter(v => v.checkpoint_id !== checkpoint.id),
        {
          checkpoint_id: checkpoint.id,
          visited_at: visitTime,
          is_valid: isWithinRange,
        },
      ]);

      // Show appropriate message
      if (isWithinRange) {
        Alert.alert(
          '✅ Checkpoint Verified',
          `Successfully checked in at ${checkpoint.name}.\n\nDistance: ${distance.toFixed(1)}m from checkpoint.`,
          [{ text: 'Continue' }]
        );
      } else {
        Alert.alert(
          '⚠️ Outside Range',
          `You are ${distance.toFixed(1)}m from ${checkpoint.name}.\n\nMove closer to the checkpoint and try again.`,
          [{ text: 'OK' }]
        );
      }

      // Check if photo is required
      if (checkpoint.requires_photo && isWithinRange) {
        // TODO: Implement photo capture
        Alert.alert('Photo Required', 'This checkpoint requires a photo verification.');
      }

    } catch (error) {
      console.error('Error processing checkpoint visit:', error);
      Alert.alert('Error', 'Failed to process checkpoint visit.');
    }
  };

  const manualCheckIn = async (checkpoint: PatrolCheckpoint) => {
    Alert.alert(
      'Manual Check-in',
      `Manually check in at ${checkpoint.name}?\n\nThis should only be used if the QR code is damaged or unreadable.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: async () => {
            try {
              const currentSession = patrolService.getCurrentSession();
              if (!currentSession) return;

              const location = await Location.getCurrentPositionAsync();
              const distance = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                checkpoint.latitude,
                checkpoint.longitude
              );

              const isWithinRange = distance <= checkpoint.radius_meters;
              const visitTime = new Date().toISOString();

              const visitData = {
                session_id: currentSession.id,
                checkpoint_id: checkpoint.id,
                visited_at: visitTime,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                distance_from_checkpoint_meters: distance,
                manual_check_in: true,
                is_valid_visit: isWithinRange,
                validation_flags: isWithinRange ? null : ['outside_radius', 'manual_checkin'],
              };

              const { error } = await supabase
                .from('checkpoint_visits')
                .insert(visitData);

              if (error) {
                Alert.alert('Error', 'Failed to record manual check-in.');
                return;
              }

              setCheckpointVisits(prev => [
                ...prev.filter(v => v.checkpoint_id !== checkpoint.id),
                {
                  checkpoint_id: checkpoint.id,
                  visited_at: visitTime,
                  is_valid: isWithinRange,
                },
              ]);

              Alert.alert('Manual Check-in Complete', `Checked in at ${checkpoint.name}.`);

            } catch (error) {
              console.error('Error with manual check-in:', error);
              Alert.alert('Error', 'Failed to complete manual check-in.');
            }
          },
        },
      ]
    );
  };


  const getCheckpointStatus = (checkpoint: PatrolCheckpoint) => {
    const visit = checkpointVisits.find(v => v.checkpoint_id === checkpoint.id);
    
    if (!visit) {
      return { status: 'pending', color: '#6b7280', icon: 'ellipse-outline' };
    }
    
    if (visit.is_valid) {
      return { status: 'completed', color: '#10b981', icon: 'checkmark-circle' };
    } else {
      return { status: 'warning', color: '#f59e0b', icon: 'warning' };
    }
  };

  const getDistanceToCheckpoint = (checkpoint: PatrolCheckpoint): string => {
    if (!currentLocation) return 'Calculating...';

    const distance = calculateDistance(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      checkpoint.latitude,
      checkpoint.longitude
    );

    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    } else {
      return `${(distance / 1000).toFixed(1)}km away`;
    }
  };

  const completedCount = checkpointVisits.filter(v => v.is_valid).length;
  const totalCount = patrolRoute.checkpoints.length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Patrol Checkpoints</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount}/{totalCount} completed
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(completedCount / totalCount) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((completedCount / totalCount) * 100)}% Complete
        </Text>
      </View>

      {/* Checkpoints List */}
      <ScrollView style={styles.content}>
        {patrolRoute.checkpoints.map((checkpoint, index) => {
          const status = getCheckpointStatus(checkpoint);
          const visit = checkpointVisits.find(v => v.checkpoint_id === checkpoint.id);
          
          return (
            <View key={checkpoint.id} style={styles.checkpointCard}>
              <View style={styles.checkpointHeader}>
                <View style={styles.checkpointNumber}>
                  <Text style={styles.checkpointNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.checkpointInfo}>
                  <Text style={styles.checkpointName}>{checkpoint.name}</Text>
                  <Text style={styles.checkpointDistance}>
                    {getDistanceToCheckpoint(checkpoint)}
                  </Text>
                  {visit && (
                    <Text style={styles.visitTime}>
                      Visited: {new Date(visit.visited_at).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
                <View style={styles.checkpointStatus}>
                  <Ionicons 
                    name={status.icon as any} 
                    size={24} 
                    color={status.color} 
                  />
                </View>
              </View>

              {checkpoint.requires_photo && (
                <View style={styles.requirementBadge}>
                  <Ionicons name="camera-outline" size={12} color="#3b82f6" />
                  <Text style={styles.requirementText}>Photo Required</Text>
                </View>
              )}

              {checkpoint.photo_instructions && (
                <Text style={styles.instructions}>
                  📸 {checkpoint.photo_instructions}
                </Text>
              )}

              {/* Action buttons */}
              <View style={styles.checkpointActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.scanButton]}
                  onPress={() => openScanner(checkpoint)}
                  disabled={status.status === 'completed'}
                >
                  <Ionicons name="qr-code-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>
                    {status.status === 'completed' ? 'Scanned' : 'Scan QR'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.manualButton]}
                  onPress={() => manualCheckIn(checkpoint)}
                  disabled={status.status === 'completed'}
                >
                  <Ionicons name="hand-left-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Manual</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Patrol Progress</Text>
          <View style={styles.summaryStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalCount - completedCount}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.scannerContainer}>
          <StatusBar style="light" />
          
          {/* Scanner Header */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowScanner(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Checkpoint QR Code</Text>
          </View>

          {hasPermission === false ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="camera-outline" size={64} color="#6b7280" />
              <Text style={styles.permissionText}>Camera permission is required</Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestCameraPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
              
              {/* Scanner Overlay */}
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.scannerInstructions}>
                  Point camera at QR code
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#93c5fd',
    fontSize: 14,
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  checkpointCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkpointNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkpointNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkpointInfo: {
    flex: 1,
  },
  checkpointName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  checkpointDistance: {
    fontSize: 12,
    color: '#6b7280',
  },
  visitTime: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  checkpointStatus: {
    marginLeft: 12,
  },
  requirementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 4,
  },
  instructions: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },
  checkpointActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  scanButton: {
    backgroundColor: '#3b82f6',
  },
  manualButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 100,
  },
  // Scanner modal styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
});