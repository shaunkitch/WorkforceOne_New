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
import { signInWithEmail, signUpWithEmail } from '../lib/supabase';

declare global {
  var qrScanCallback: ((data: string) => void) | undefined;
  var pendingInvitationCode: string | undefined;
  var pendingInvitationType: 'guard' | 'product' | undefined;
}

interface Props {
  onAuthSuccess: () => void;
  navigation?: any;
}

export default function AuthScreen({ onAuthSuccess, navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp 
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (error) {
        Alert.alert('Authentication Error', error.message);
      } else {
        // Check if there's a pending invitation to process
        if (global.pendingInvitationCode) {
          try {
            // Process the pending invitation using the complete function
            const { completeInvitationAfterAuth } = await import('../lib/supabase');
            const { data: result, error: inviteError } = await completeInvitationAfterAuth(global.pendingInvitationCode);
            
            if (!inviteError && result?.success) {
              const inviteType = global.pendingInvitationType === 'guard' ? 'Guard Management' : 'WorkforceOne';
              Alert.alert(
                '✅ Welcome!', 
                `Successfully joined ${inviteType}! Access granted to: ${result.products.join(', ')}`, 
                [{ text: 'Continue', onPress: onAuthSuccess }],
                { cancelable: false }
              );
            } else {
              // Even if invitation processing failed, continue to dashboard
              console.error('Pending invitation processing failed:', inviteError);
              onAuthSuccess();
            }
          } catch (error) {
            console.error('Error processing pending invitation:', error);
            // Continue to dashboard even if invitation processing fails
            onAuthSuccess();
          }
          
          // Clear the pending invitation
          global.pendingInvitationCode = undefined;
          global.pendingInvitationType = undefined;
          return;
        }
        onAuthSuccess();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanner = () => {
    if (navigation) {
      // Store the callback in state to avoid navigation warning
      const scanCallback = async (data: string) => {
        try {
          console.log('QR Data Scanned:', data);
          
          let qrData;
          
          // Handle different QR code formats
          if (data.startsWith('GUARD_INVITE:')) {
            // Guard invitation format: "GUARD_INVITE:{...json...}"
            const jsonPart = data.substring('GUARD_INVITE:'.length);
            const guardData = JSON.parse(jsonPart);
            
            // Convert guard invitation to product invitation format
            qrData = {
              type: 'product_invitation',
              invitationCode: guardData.code,
              products: ['guard-management'],
              organizationName: 'Security Guard System',
              guardInvite: true,
              originalData: guardData
            };
          } else if (data.startsWith('{')) {
            // Pure JSON format
            qrData = JSON.parse(data);
          } else {
            // Other formats (URLs, plain text, etc.)
            throw new Error('Unsupported QR code format');
          }
          
          console.log('Parsed QR Data:', qrData);
          
          if (qrData.type === 'product_invitation') {
            console.log('Processing product invitation:', qrData.invitationCode);
            
            let result, error;
            
            // Extract user info from QR data for auto sign-up
            const userEmail = qrData.originalData?.email || 
                             qrData.originalData?.contact?.email || 
                             null;
            const userName = qrData.originalData?.name || 
                            qrData.originalData?.contact?.name || 
                            'New User';
            
            if (qrData.guardInvite) {
              // Handle guard invitation with auto sign-up
              // Try auto sign-up even without email by generating one from invitation code
              const autoEmail = userEmail || `${qrData.invitationCode.toLowerCase()}@auto-invite.temp`;
              console.log('Auto sign-up attempt with email:', autoEmail);
              
              try {
                // Attempt actual automatic sign-up with Supabase Auth
                console.log('Attempting auto sign-up for guard invitation...');
                const { autoSignUpWithInvitation } = await import('../lib/supabase');
                const authResponse = await autoSignUpWithInvitation(qrData.invitationCode, autoEmail, userName);
                
                if (!authResponse.error && authResponse.data?.auto_signed_in) {
                  // User was actually created and automatically signed in
                  console.log('Auto sign-in successful for guard invitation, navigating to dashboard...');
                  // Navigate directly to Dashboard without any popup
                  onAuthSuccess();
                  return;
                } else if (authResponse.data?.needs_confirmation) {
                  // Account created but needs email confirmation
                  console.log('Account created but needs email confirmation');
                  Alert.alert(
                    '📧 Check Your Email', 
                    `Account created for ${autoEmail}! Please check your email and confirm your account, then try scanning the QR code again.`,
                    [{ text: 'OK' }]
                  );
                  return;
                } else {
                  console.log('Auto sign-up failed, will try validation only:', authResponse.error);
                }
              } catch (autoError) {
                console.log('Auto sign-up exception, will try validation only:', autoError);
              }
              
              // Fallback: Just validate invitation and show manual signup
              const { acceptGuardInvitation } = await import('../lib/supabase');
              const response = await acceptGuardInvitation(qrData.invitationCode, userEmail, userName);
              result = response.data;
              error = response.error;
            } else {
              // Handle regular product invitation with auto sign-up
              // Try auto sign-up even without email by generating one from invitation code
              const autoEmail = userEmail || `${qrData.invitationCode.toLowerCase()}@auto-invite.temp`;
              console.log('Auto sign-up attempt with email:', autoEmail);
              
              try {
                // Attempt actual automatic sign-up with Supabase Auth
                console.log('Attempting auto sign-up for product invitation...');
                const { autoSignUpWithInvitation } = await import('../lib/supabase');
                const authResponse = await autoSignUpWithInvitation(qrData.invitationCode, autoEmail, userName);
                
                if (!authResponse.error && authResponse.data?.auto_signed_in) {
                  // User was actually created and automatically signed in
                  console.log('Auto sign-in successful for product invitation, navigating to dashboard...');
                  // Navigate directly to Dashboard without any popup
                  onAuthSuccess();
                  return;
                } else if (authResponse.data?.needs_confirmation) {
                  // Account created but needs email confirmation
                  console.log('Account created but needs email confirmation');
                  Alert.alert(
                    '📧 Check Your Email', 
                    `Account created for ${autoEmail}! Please check your email and confirm your account, then try scanning the QR code again.`,
                    [{ text: 'OK' }]
                  );
                  return;
                } else {
                  console.log('Auto sign-up failed, will try validation only:', authResponse.error);
                }
              } catch (autoError) {
                console.log('Auto sign-up exception, will try validation only:', autoError);
              }
              
              // Fallback: Just validate invitation and show manual signup
              const { acceptProductInvitation } = await import('../lib/supabase');
              const response = await acceptProductInvitation(qrData.invitationCode, userEmail, userName);
              result = response.data;
              error = response.error;
            }
            
            console.log('Invitation processing result:', { result, error });
            
            if (error) {
              console.error('Invitation error:', error);
              Alert.alert('Invitation Error', error);
            } else if (result?.success) {
              if (result.requires_signup || result.auto_signup) {
                const inviteType = qrData.guardInvite ? 'Guard Management' : 'WorkforceOne';
                Alert.alert(
                  `🎉 ${inviteType} Invitation!`, 
                  `You're invited to join ${qrData.organizationName || 'organization'}.\n\nAccess: ${qrData.products.join(', ')}\n\nPlease sign up or log in to complete the process.`,
                  [{ text: 'OK' }]
                );
                // Store invitation data for later use after authentication
                global.pendingInvitationCode = qrData.invitationCode;
                global.pendingInvitationType = qrData.guardInvite ? 'guard' : 'product';
              } else {
                // User is already authenticated and invitation processed successfully
                console.log('Invitation processed successfully, navigating to dashboard...');
                // Navigate directly to Dashboard without any popup
                onAuthSuccess();
              }
            } else {
              console.error('Invitation failed:', result);
              Alert.alert('Error', result?.error || 'Failed to process invitation');
            }
          } else {
            console.log('Invalid QR type:', qrData.type);
            Alert.alert('Invalid QR Code', 'This is not a valid WorkforceOne invitation code');
          }
        } catch (error) {
          console.error('QR Parse Error:', error);
          console.log('Raw QR Data:', data);
          Alert.alert(
            'QR Code Debug Info', 
            `Raw data: ${data.substring(0, 100)}...\n\nError: ${error.message}\n\nThis should be JSON starting with {"type":"product_invitation"...}`
          );
        }
      };
      
      // Store callback in a global variable to pass to QRScanner
      global.qrScanCallback = scanCallback;
      navigation.navigate('QRScanner');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#6366f1']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>⚡</Text>
            <Text style={styles.title}>WorkforceOne</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleQRScanner}
            >
              <Text style={styles.qrIcon}>📱</Text>
              <Text style={styles.secondaryButtonText}>
                Scan QR Code to Join
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure • Unified • Mobile-First
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
    backgroundColor: '#1e40af',
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  qrIcon: {
    fontSize: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: '#e0e7ff',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#c7d2fe',
    textAlign: 'center',
  },
});