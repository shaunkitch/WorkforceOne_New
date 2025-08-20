import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CheckInScreen() {
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);

  const handleQRScan = () => {
    Alert.alert(
      'QR Scanner',
      'Open camera to scan QR code at your assigned location',
      [
        { text: 'Cancel' },
        { 
          text: 'Open Camera', 
          onPress: () => {
            // Simulate successful check-in
            const now = new Date().toLocaleTimeString();
            setLastCheckIn(now);
            Alert.alert('Success', `Checked in at Downtown Office at ${now}`);
          }
        }
      ]
    );
  };

  const handleManualCheckIn = () => {
    Alert.alert(
      'Manual Check-In',
      'Confirm your location for manual check-in',
      [
        { text: 'Cancel' },
        { 
          text: 'Check In', 
          onPress: () => {
            const now = new Date().toLocaleTimeString();
            setLastCheckIn(now);
            Alert.alert('Success', `Manually checked in at ${now}`);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.header}>
        <Text style={styles.headerTitle}>Security Check-In</Text>
        <Text style={styles.headerSubtitle}>Scan QR code or check in manually</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Status</Text>
          {lastCheckIn ? (
            <View>
              <Text style={styles.statusActive}>✅ Checked In</Text>
              <Text style={styles.statusTime}>Last check-in: {lastCheckIn}</Text>
            </View>
          ) : (
            <Text style={styles.statusInactive}>❌ Not Checked In</Text>
          )}
        </View>

        <View style={styles.checkInOptions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleQRScan}>
            <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.buttonGradient}>
              <Text style={styles.buttonIcon}>📱</Text>
              <Text style={styles.buttonText}>Scan QR Code</Text>
              <Text style={styles.buttonSubtext}>Recommended method</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleManualCheckIn}>
            <Text style={styles.secondaryButtonIcon}>📍</Text>
            <Text style={styles.secondaryButtonText}>Manual Check-In</Text>
            <Text style={styles.secondaryButtonSubtext}>Use if QR unavailable</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Instructions</Text>
          <Text style={styles.infoText}>
            1. Scan the QR code at your assigned location{'\n'}
            2. Verify your identity when prompted{'\n'}
            3. Confirm your check-in status{'\n'}
            4. Proceed with your assigned duties
          </Text>
        </View>

        <View style={styles.emergencySection}>
          <TouchableOpacity style={styles.emergencyButton}>
            <Text style={styles.emergencyIcon}>🚨</Text>
            <Text style={styles.emergencyText}>Emergency Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  statusActive: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusInactive: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
  },
  statusTime: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  checkInOptions: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    padding: 24,
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7c3aed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 4,
  },
  secondaryButtonSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
  emergencySection: {
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyIcon: {
    fontSize: 20,
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
});