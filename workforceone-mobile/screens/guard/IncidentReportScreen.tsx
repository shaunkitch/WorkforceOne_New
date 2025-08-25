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
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Convert photos to base64 for web compatibility
      const convertedPhotos = await Promise.all(
        photos.map(async (photo) => await convertImageToBase64(photo))
      );
      
      // Get current user
      const { user } = await getUser();
      const guardId = user?.id || 'anonymous';
      const guardName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Security Guard';

      const reportId = `INC-${Date.now()}`;
      
      // Create auto-generated title based on incident type
      const selectedType = INCIDENT_TYPES.find(type => type.id === incidentType);
      const autoTitle = `${selectedType?.label || 'Incident'} - ${new Date().toLocaleDateString()}`;
      
      // Prepare incident data for database
      const incidentData = {
        id: reportId,
        title: autoTitle,
        description,
        category: incidentType,
        severity,
        latitude: location?.coordinates?.latitude || 0,
        longitude: location?.coordinates?.longitude || 0,
        address: location?.address || 'Location unavailable',
        guard_id: guardId,
        guard_name: guardName,
        status: 'submitted',
        metadata: {
          photos: photos.length,
          photo_urls: convertedPhotos,
          timestamp: new Date().toISOString(),
          device_info: Platform.OS
        }
      };

      try {
        // Add incident to outbox - this will automatically try to sync
        const outboxId = await syncManager.addToOutbox('incident', incidentData);

        // Also save to local storage for immediate access
        const report: IncidentReport = {
          id: reportId,
          type: incidentType,
          severity,
          title: autoTitle,
          description,
          location: location || {
            address: 'Location unavailable',
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

        // Clear draft
        await AsyncStorage.removeItem('incidentDraft');

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
          'Report Submitted',
          'Your incident report has been saved and will be sent when you have internet connection.',
          [
            { 
              text: 'Done', 
              onPress: () => {
                resetForm();
                navigation.goBack();
              }
            }
          ]
        );

      } catch (error) {
        Alert.alert(
          'Report Saved',
          'Your report has been saved locally and will be sent when connection is available.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to save report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('type');
    setIncidentType('');
    setSeverity('medium');
    setDescription('');
    setPhotos([]);
    setLocation(null);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Step progress indicator
  const getStepNumber = (step: StepType): number => {
    const steps: StepType[] = ['type', 'details', 'photo', 'review'];
    return steps.indexOf(step) + 1;
  };

  // Render step-specific content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'type':
        return renderTypeSelection();
      case 'details':
        return renderDetailsForm();
      case 'photo':
        return renderPhotoCapture();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What happened?</Text>
      <Text style={styles.stepSubtitle}>Choose the type of issue you want to report</Text>
      
      <View style={styles.typeGrid}>
        {INCIDENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              incidentType === type.id && [styles.typeCardSelected, { borderColor: type.color }],
            ]}
            onPress={() => {
              setIncidentType(type.id);
              Haptics.selectionAsync();
            }}
          >
            <View style={[styles.typeIconContainer, { backgroundColor: incidentType === type.id ? type.color : '#f1f5f9' }]}>
              <Ionicons 
                name={type.icon as any} 
                size={32} 
                color={incidentType === type.id ? '#ffffff' : type.color} 
              />
            </View>
            <Text style={[styles.typeLabel, incidentType === type.id && { color: type.color, fontWeight: '700' }]}>
              {type.label}
            </Text>
            <Text style={styles.typeDescription}>
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDetailsForm = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us what happened</Text>
      <Text style={styles.stepSubtitle}>Provide details about the situation</Text>
      
      <View style={styles.detailsCard}>
        <Text style={styles.inputLabel}>How serious is this?</Text>
        <View style={styles.severityContainer}>
          {(['low', 'medium', 'high'] as const).map((level) => {
            const colors = {
              low: '#10b981',
              medium: '#f59e0b',
              high: '#ef4444'
            };
            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityButton,
                  severity === level && [styles.severityButtonSelected, { backgroundColor: colors[level] }],
                ]}
                onPress={() => {
                  setSeverity(level);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[
                  styles.severityText,
                  severity === level && styles.severityTextSelected,
                ]}>
                  {level === 'low' ? 'Low' : level === 'medium' ? 'Medium' : 'High'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 24 }]}>What happened?</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe what you saw or what happened..."
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit
        />

        {location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={20} color="#64748b" />
            <Text style={styles.locationText}>{location.address}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPhotoCapture = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Add photos (optional)</Text>
      <Text style={styles.stepSubtitle}>Take pictures to help explain what happened</Text>
      
      <View style={styles.photoSection}>
        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => {
                    removePhoto(index);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  }}
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        
        {photos.length < 3 && (
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleTakePhoto}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.cameraGradient}
            >
              <Ionicons name="camera" size={32} color="#ffffff" />
              <Text style={styles.cameraButtonText}>Take Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {photos.length === 0 && (
          <Text style={styles.photoHint}>Photos help us understand what happened better</Text>
        )}
      </View>
    </View>
  );

  const renderReviewStep = () => {
    const selectedType = INCIDENT_TYPES.find(type => type.id === incidentType);
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Review your report</Text>
        <Text style={styles.stepSubtitle}>Make sure everything looks correct</Text>
        
        <View style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Ionicons name={selectedType?.icon as any} size={24} color={selectedType?.color} />
            <View style={styles.reviewContent}>
              <Text style={styles.reviewLabel}>Issue Type</Text>
              <Text style={styles.reviewValue}>{selectedType?.label}</Text>
            </View>
          </View>

          <View style={styles.reviewRow}>
            <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" />
            <View style={styles.reviewContent}>
              <Text style={styles.reviewLabel}>Priority Level</Text>
              <Text style={[styles.reviewValue, { 
                color: severity === 'low' ? '#10b981' : severity === 'medium' ? '#f59e0b' : '#ef4444' 
              }]}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.reviewRow}>
            <Ionicons name="document-text-outline" size={24} color="#64748b" />
            <View style={styles.reviewContent}>
              <Text style={styles.reviewLabel}>Description</Text>
              <Text style={styles.reviewValue} numberOfLines={3}>{description}</Text>
            </View>
          </View>

          {photos.length > 0 && (
            <View style={styles.reviewRow}>
              <Ionicons name="image-outline" size={24} color="#64748b" />
              <View style={styles.reviewContent}>
                <Text style={styles.reviewLabel}>Photos</Text>
                <Text style={styles.reviewValue}>{photos.length} photo{photos.length > 1 ? 's' : ''} attached</Text>
              </View>
            </View>
          )}

          {location && (
            <View style={styles.reviewRow}>
              <Ionicons name="location-outline" size={24} color="#64748b" />
              <View style={styles.reviewContent}>
                <Text style={styles.reviewLabel}>Location</Text>
                <Text style={styles.reviewValue} numberOfLines={2}>{location.address}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {currentStep !== 'type' && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Report an Issue</Text>
            <Text style={styles.headerSubtitle}>Step {getStepNumber(currentStep)} of 4</Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(getStepNumber(currentStep) / 4) * 100}%` }]} />
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={[{ opacity: fadeAnim }]}>
            {renderStepContent()}
          </Animated.View>
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActions}>
          {currentStep === 'review' ? (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={['#dc2626', '#ef4444']}
                style={styles.submitGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                <Text style={styles.submitText}>
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={nextStep}
            >
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                style={styles.nextGradient}
              >
                <Text style={styles.nextText}>
                  {currentStep === 'photo' ? 'Continue' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {currentStep === 'photo' && (
            <TouchableOpacity style={styles.skipButton} onPress={nextStep}>
              <Text style={styles.skipButtonText}>Skip Photos</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },

  // Content Styles
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  stepContainer: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },

  // Type Selection Styles
  typeGrid: {
    gap: 16,
  },
  typeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 160,
  },
  typeCardSelected: {
    borderWidth: 3,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  typeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  typeDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Details Form Styles
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    minHeight: 56,
  },
  severityButtonSelected: {
    borderWidth: 0,
  },
  severityText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  severityTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    gap: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#64748b',
    flex: 1,
  },

  // Photo Section Styles
  photoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  photoScroll: {
    marginBottom: 20,
  },
  photoWrapper: {
    marginRight: 16,
    position: 'relative',
  },
  photoPreview: {
    width: 150,
    height: 150,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  photoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cameraGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    minHeight: 80,
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  photoHint: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Review Step Styles
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  reviewContent: {
    flex: 1,
  },
  reviewLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },

  // Bottom Actions
  bottomActions: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  nextText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
});