import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmail } from '../lib/supabase';

interface Props {
  onAuthSuccess: () => void;
  navigation?: any;
}

type AuthMode = 'qr' | 'email';

export default function AuthScreen({ onAuthSuccess, navigation }: Props) {
  const [authMode, setAuthMode] = useState<AuthMode>('qr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithEmail(email, password);
      
      if (error) {
        Alert.alert('Sign In Failed', 'Please check your email and password');
      } else {
        onAuthSuccess();
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    if (navigation) {
      // Set up QR scan callback
      global.qrScanCallback = async (qrData: string) => {
        try {
          console.log('QR Code scanned:', qrData);
          
          // Parse QR code data
          if (qrData.startsWith('GUARD_INVITE:')) {
            const jsonPart = qrData.replace('GUARD_INVITE:', '');
            try {
              const inviteData = JSON.parse(jsonPart);
              const invitationCode = inviteData.code;
              
              console.log('Processing guard invitation:', invitationCode);
              
              // Process the QR invitation with auto sign-up
              const { processQRInvitation } = await import('../lib/supabase');
              const email = `guard-${invitationCode.toLowerCase()}@auto-invite.temp`;
              const name = 'Security Guard';
              
              const result = await processQRInvitation(invitationCode, email, name);
              
              if (result.error) {
                console.error('QR invitation processing failed:', result.error);
                Alert.alert('QR Processing Failed', result.error);
              } else {
                console.log('QR invitation processed successfully:', result.data);
                onAuthSuccess();
              }
            } catch (parseError) {
              console.error('Failed to parse QR invite data:', parseError);
              Alert.alert('Invalid QR Code', 'Unable to parse invitation data');
            }
          } else {
            // Handle other QR code formats or fall back to simple success
            console.log('Non-invitation QR code, proceeding with simple auth');
            onAuthSuccess();
          }
        } catch (error) {
          console.error('QR processing error:', error);
          Alert.alert('Invalid QR Code', 'Please scan a valid WorkforceOne QR code');
        }
      };
      
      navigation.navigate('QRScanner');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6', '#1e40af']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>🛡️</Text>
              </View>
              <Text style={styles.title}>Sign In to WorkforceOne</Text>
              <Text style={styles.subtitle}>Security Management System</Text>
            </View>

            {/* Auth Mode Selection */}
            <View style={styles.authContainer}>
              {authMode === 'qr' ? (
                // QR Code Mode (Primary)
                <View style={styles.qrSection}>
                  <View style={styles.instructionCard}>
                    <Text style={styles.instructionTitle}>Scan Your Badge</Text>
                    <Text style={styles.instructionText}>
                      Point your camera at the QR code on your employee badge or invitation
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={handleQRScan}
                    activeOpacity={0.8}
                  >
                    <View style={styles.scanIcon}>
                      <Text style={styles.scanIconText}>📱</Text>
                    </View>
                    <Text style={styles.scanButtonText}>Scan QR Code</Text>
                    <Text style={styles.scanButtonSubtext}>Quick & Easy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchModeButton}
                    onPress={() => setAuthMode('email')}
                  >
                    <Text style={styles.switchModeText}>Use Email Instead</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Email Mode (Fallback)
                <View style={styles.emailSection}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setAuthMode('qr')}
                  >
                    <Text style={styles.backButtonText}>← Back to QR Scan</Text>
                  </TouchableOpacity>

                  <View style={styles.emailForm}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="your.email@company.com"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="password"
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.signInButton, loading && styles.buttonDisabled]}
                      onPress={handleEmailSignIn}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.signInButtonText}>
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Secure • Professional • Trusted
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    minHeight: '100%',
  },
  
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    fontSize: 72,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#e2e8f0',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Auth Container
  authContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // QR Section Styles
  qrSection: {
    alignItems: 'center',
  },
  instructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
  },
  scanButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  scanIcon: {
    marginBottom: 8,
  },
  scanIconText: {
    fontSize: 48,
  },
  scanButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  scanButtonSubtext: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  switchModeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  switchModeText: {
    fontSize: 18,
    color: '#e2e8f0',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  // Email Section Styles
  emailSection: {
    width: '100%',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 18,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  emailForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minHeight: 64,
  },
  signInButton: {
    backgroundColor: '#1e40af',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 64,
    justifyContent: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // Footer Styles
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    fontWeight: '500',
  },
});