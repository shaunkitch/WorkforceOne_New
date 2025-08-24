import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';

declare global {
  var qrScanCallback: ((data: string) => void) | undefined;
}

const { width } = Dimensions.get('window');

interface Props {
  route?: {
    params?: {
      onScan?: (data: string) => void;
    };
  };
}

export default function QRScannerScreen({ route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'product_invitation') {
        Alert.alert(
          '🎉 WorkforceOne Invitation',
          `${qrData.organizationName || 'Organization'}\n\nProducts: ${qrData.products.map(p => p.replace('-', ' ')).join(', ')}\n\nCode: ${qrData.invitationCode}`,
          [
            { text: 'Cancel', onPress: () => setScanned(false) },
            {
              text: 'Join Now',
              onPress: () => {
                const callback = route?.params?.onScan || global.qrScanCallback;
                if (callback) callback(data);
                navigation.goBack();
              }
            }
          ]
        );
      } else if (qrData.type === 'site_checkin') {
        Alert.alert(
          'Site Check-in',
          `Check in at: ${qrData.siteName}`,
          [
            { text: 'Cancel', onPress: () => setScanned(false) },
            {
              text: 'Check In',
              onPress: () => {
                const callback = route?.params?.onScan || global.qrScanCallback;
                if (callback) callback(data);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'QR Code Scanned',
          data,
          [
            { text: 'OK', onPress: () => {
              const callback = route?.params?.onScan || global.qrScanCallback;
              if (callback) callback(data);
              navigation.goBack();
            }}
          ]
        );
      }
    } catch (error) {
      // Handle plain text QR codes
      Alert.alert(
        'QR Code Scanned',
        data,
        [
          { text: 'OK', onPress: () => {
            const callback = route?.params?.onScan || global.qrScanCallback;
            if (callback) callback(data);
            navigation.goBack();
          }}
        ]
      );
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Text style={styles.message}>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => requestPermission()}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CameraView
        style={styles.scanner}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            Position the QR code within the frame to scan
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rescanButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});