import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { GuardStackParamList } from '../../navigation/DashboardNavigator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getUser } from '../../lib/supabase';
import syncManager from '../../lib/syncManager';
import { getCurrentUserProfile, UserProfile, logRoleBasedAccess } from '../../lib/rbac';
import { Ionicons } from '@expo/vector-icons';

type IncidentReportRouteProp = RouteProp<GuardStackParamList, 'IncidentReport'>;
type IncidentReportNavigationProp = StackNavigationProp<GuardStackParamList, 'IncidentReport'>;

interface IncidentReport {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  photos: string[];
  timestamp: string;
  guardId: string;
  status: 'draft' | 'submitted' | 'resolved';
}

// Simplified to 4 most common incident types
const INCIDENT_TYPES = [
  { 
    id: 'safety', 
    label: 'Safety Issue', 
    icon: 'shield-outline',
    description: 'Theft, suspicious activity, security concerns',
    color: '#ef4444'
  },
  { 
    id: 'property', 
    label: 'Property Damage', 
    icon: 'construct-outline',
    description: 'Vandalism, broken equipment, damage',
    color: '#f59e0b'
  },
  { 
    id: 'emergency', 
    label: 'Emergency', 
    icon: 'medical-outline',
    description: 'Medical, fire, urgent situations',
    color: '#dc2626'
  },
  { 
    id: 'other', 
    label: 'Other', 
    icon: 'document-text-outline',
    description: 'Any other incident or concern',
    color: '#6b7280'
  },
];

type StepType = 'type' | 'details' | 'photo' | 'review';

export default function IncidentReportScreen() {
  const route = useRoute<IncidentReportRouteProp>();
  const navigation = useNavigation<IncidentReportNavigationProp>();
  const fromPatrol = route.params?.fromPatrol || false;
  
  // State management
  const [currentStep, setCurrentStep] = useState<StepType>('type');
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Auto-get location on component mount
  useEffect(() => {
    getCurrentLocation();
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Save draft automatically when form data changes
  useEffect(() => {
    saveDraft();
  }, [incidentType, severity, description, photos]);

  // Auto-save draft function
  const saveDraft = async () => {
    if (!incidentType && !description && photos.length === 0) return;

    try {
      const draftData = {
        incidentType,
        severity,
        description,
        photos,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem('incidentDraft', JSON.stringify(draftData));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Load draft on mount
  const loadDraft = async () => {
    try {
      const draftData = await AsyncStorage.getItem('incidentDraft');
      if (draftData) {
        const draft = JSON.parse(draftData);
        setIncidentType(draft.incidentType || '');
        setSeverity(draft.severity || 'medium');
        setDescription(draft.description || '');
        setPhotos(draft.photos || []);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'We need camera access to take photos for your report.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      setLocation({
        coordinates: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        },
        address: address[0] ? 
          `${address[0].street || ''} ${address[0].city || ''} ${address[0].region || ''}`.trim() :
          'Current location',
      });
    } catch (error) {
      console.log('Failed to get location:', error);
      setLocation({
        coordinates: { latitude: 0, longitude: 0 },
        address: 'Location unavailable'
      });
    }
  };

  // Navigation between steps
  const nextStep = () => {
    switch (currentStep) {
      case 'type':
        if (!incidentType) {
          Alert.alert('Selection Required', 'Please select an incident type to continue.');
          return;
        }
        setCurrentStep('details');
        break;
      case 'details':
        if (!description.trim()) {
          Alert.alert('Details Required', 'Please provide a description of what happened.');
          return;
        }
        setCurrentStep('photo');
        break;
      case 'photo':
        setCurrentStep('review');
        break;
    }
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      fadeAnim.setValue(1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'details':
        setCurrentStep('type');
        break;
      case 'photo':
        setCurrentStep('details');
        break;
      case 'review':
        setCurrentStep('photo');
        break;
    }
  };

  // Helper function to convert image URI to base64
  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      return uri; // Fallback to original URI
    }
  };

  const handleSubmit = async () => {
    if (!incidentType || !title || !description) {
      Alert.alert('Incomplete Report', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Convert photos to base64 for web compatibility
      const convertedPhotos = await Promise.all(
        photos.map(async (photo) => {
          console.log('📸 Converting photo to base64:', photo);
          const base64Photo = await convertImageToBase64(photo);
          console.log('✅ Photo converted, size:', base64Photo.length, 'chars');
          return base64Photo;
        })
      );
      
      // Get current user
      const { user } = await getUser();
      const guardId = user?.id || 'anonymous';
      const guardName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown Guard';

      const reportId = `INC-${Date.now()}`;
      
      // Prepare incident data for database
      const incidentData = {
        id: reportId,
        title,
        description,
        category: incidentType,
        severity,
        latitude: location?.coordinates?.latitude || 0,
        longitude: location?.coordinates?.longitude || 0,
        address: location?.address || 'Unknown location',
        guard_id: guardId,
        guard_name: guardName,
        status: 'submitted',
        metadata: {
          photos: photos.length,
          photo_urls: convertedPhotos, // Use base64 converted photos
          timestamp: new Date().toISOString(),
          device_info: Platform.OS
        }
      };

      // Use sync manager for reliable incident submission
      await syncManager.log('INCIDENT_SUBMIT', 'info', 'Starting incident submission', { 
        title: incidentData.title, 
        severity: incidentData.severity 
      });

      try {
        // Add incident to outbox - this will automatically try to sync
        const outboxId = await syncManager.addToOutbox('incident', incidentData);
        
        await syncManager.log('INCIDENT_SUBMIT', 'success', 'Incident added to sync queue', { 
          outboxId,
          reportId 
        });

        // Also save to local storage for immediate access
        const report: IncidentReport = {
          id: reportId,
          type: incidentType,
          severity,
          title,
          description,
          location: location || {
            address: 'Unknown',
            coordinates: { latitude: 0, longitude: 0 },
          },
          photos: convertedPhotos,
          timestamp: new Date().toISOString(),
          guardId,
          status: 'submitted',
        };

        const existingReports = await AsyncStorage.getItem('incidentReports');
        const reports = existingReports ? JSON.parse(existingReports) : [];
        reports.unshift(report);
        await AsyncStorage.setItem('incidentReports', JSON.stringify(reports));

        // If this incident was reported during patrol, update patrol stats
        if (fromPatrol) {
          try {
            const activePatrolData = await AsyncStorage.getItem('activePatrol');
            if (activePatrolData) {
              const patrol = JSON.parse(activePatrolData);
              patrol.incidents_reported = (patrol.incidents_reported || 0) + 1;
              await AsyncStorage.setItem('activePatrol', JSON.stringify(patrol));
            }
          } catch (error) {
            console.error('Failed to update patrol stats:', error);
          }
        }

        Alert.alert(
          'Incident Reported',
          `Incident "${title}" has been queued for submission. Check the sync status in the debug screen to monitor progress.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                resetForm();
                if (fromPatrol) {
                  navigation.goBack(); // Return to patrol screen
                }
              }
            },
            { 
              text: 'View Sync Status', 
              onPress: () => {
                resetForm();
                if (fromPatrol) {
                  navigation.goBack(); // Return to patrol screen
                } else {
                  // Navigation to sync debug screen would go here
                }
              }
            }
          ]
        );

      } catch (error) {
        await syncManager.log('INCIDENT_SUBMIT', 'error', 'Failed to queue incident', error);
        
        Alert.alert(
          'Submission Error',
          'Failed to queue incident for submission. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIncidentType('');
    setSeverity('medium');
    setTitle('');
    setDescription('');
    setPhotos([]);
    setLocation(null);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#dc2626', '#ef4444']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Incident Report</Text>
          <Text style={styles.headerSubtitle}>Report security incidents immediately</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Incident Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Type *</Text>
            <View style={styles.typeGrid}>
              {INCIDENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    incidentType === type.id && styles.typeCardSelected,
                  ]}
                  onPress={() => setIncidentType(type.id)}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.typeLabel,
                    incidentType === type.id && styles.typeLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity Level *</Text>
            <View style={styles.severityContainer}>
              {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityButton,
                    severity === level && styles.severityButtonSelected,
                    severity === level && {
                      backgroundColor:
                        level === 'low' ? '#10b981' :
                        level === 'medium' ? '#f59e0b' :
                        level === 'high' ? '#ef4444' :
                        '#7c3aed',
                    },
                  ]}
                  onPress={() => setSeverity(level)}
                >
                  <Text style={[
                    styles.severityText,
                    severity === level && styles.severityTextSelected,
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief description of the incident"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide detailed information about the incident..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            {location ? (
              <View style={styles.locationCard}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationContent}>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  <Text style={styles.locationCoords}>
                    {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={loading}
              >
                <Text style={styles.locationButtonIcon}>📍</Text>
                <Text style={styles.locationButtonText}>Get Current Location</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidence Photos</Text>
            <View style={styles.photoContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {photos.length < 4 && (
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={handleTakePhoto}
                  >
                    <Text style={styles.photoButtonIcon}>📷</Text>
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={handlePickImage}
                  >
                    <Text style={styles.photoButtonIcon}>🖼️</Text>
                    <Text style={styles.photoButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={['#dc2626', '#ef4444']}
              style={styles.submitGradient}
            >
              <Text style={styles.submitIcon}>🚨</Text>
              <Text style={styles.submitText}>
                {loading ? 'Submitting...' : 'Submit Incident Report'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Save as Draft */}
          <TouchableOpacity style={styles.draftButton}>
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  typeCardSelected: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#dc2626',
    fontWeight: '600',
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  severityButtonSelected: {
    borderWidth: 0,
  },
  severityText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  severityTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#6b7280',
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    gap: 8,
  },
  locationButtonIcon: {
    fontSize: 20,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  photoContainer: {
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  photoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  photoButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submitIcon: {
    fontSize: 24,
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  draftButton: {
    padding: 16,
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: 16,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
});