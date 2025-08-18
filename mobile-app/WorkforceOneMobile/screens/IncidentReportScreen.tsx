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
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { patrolService } from '../services/PatrolService';

const { width, height } = Dimensions.get('window');

interface Evidence {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  caption?: string;
}

const incidentCategories = [
  { value: 'security_breach', label: 'Security Breach', icon: 'shield-outline', color: '#ef4444' },
  { value: 'suspicious_activity', label: 'Suspicious Activity', icon: 'eye-outline', color: '#f97316' },
  { value: 'maintenance_issue', label: 'Maintenance Issue', icon: 'build-outline', color: '#eab308' },
  { value: 'safety_hazard', label: 'Safety Hazard', icon: 'warning-outline', color: '#ef4444' },
  { value: 'medical_emergency', label: 'Medical Emergency', icon: 'medical-outline', color: '#dc2626' },
  { value: 'fire_alarm', label: 'Fire Alarm', icon: 'flame-outline', color: '#dc2626' },
  { value: 'equipment_failure', label: 'Equipment Failure', icon: 'settings-outline', color: '#6b7280' },
  { value: 'vandalism', label: 'Vandalism', icon: 'hammer-outline', color: '#7c2d12' },
  { value: 'theft', label: 'Theft', icon: 'bag-outline', color: '#991b1b' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6b7280' },
];

const severityLevels = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'critical', label: 'Critical', color: '#dc2626' },
];

export default function IncidentReportScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [locationDescription, setLocationDescription] = useState('');
  
  // Evidence state
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Emergency flags
  const [isEmergency, setIsEmergency] = useState(false);
  const [requiresPolice, setRequiresPolice] = useState(false);
  const [requiresMedical, setRequiresMedical] = useState(false);
  const [requiresMaintenance, setRequiresMaintenance] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    requestPermissions();
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

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(cameraStatus === 'granted');

    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus !== 'granted') {
      console.warn('Media library permission not granted');
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }
    setShowCamera(true);
  };

  const capturePhoto = async (camera: Camera) => {
    try {
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      const newEvidence: Evidence = {
        id: Date.now().toString(),
        uri: photo.uri,
        type: 'photo',
      };

      setEvidence(prev => [...prev, newEvidence]);
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newEvidence: Evidence = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          type: 'photo',
        };

        setEvidence(prev => [...prev, newEvidence]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const removeEvidence = (id: string) => {
    setEvidence(prev => prev.filter(item => item.id !== id));
  };

  const addEvidenceCaption = (id: string, caption: string) => {
    setEvidence(prev =>
      prev.map(item =>
        item.id === id ? { ...item, caption } : item
      )
    );
  };

  const submitReport = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the incident.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please provide a description of the incident.');
      return;
    }

    if (!category) {
      Alert.alert('Validation Error', 'Please select an incident category.');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Location Error', 'Unable to determine your current location. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Get current patrol session if active
      const currentSession = patrolService.getCurrentSession();

      // Create incident report
      const incidentData = {
        organization_id: profile?.organization_id,
        guard_id: user?.id,
        session_id: currentSession?.id,
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        location_description: locationDescription.trim() || null,
        incident_time: new Date().toISOString(),
        is_emergency: isEmergency,
        requires_police: requiresPolice,
        requires_medical: requiresMedical,
        requires_maintenance: requiresMaintenance,
        status: 'open',
      };

      const { data: incident, error: incidentError } = await supabase
        .from('incident_reports')
        .insert(incidentData)
        .select()
        .single();

      if (incidentError || !incident) {
        throw new Error(`Failed to create incident report: ${incidentError?.message}`);
      }

      // Upload evidence files
      const attachmentPromises = evidence.map(async (evidenceItem, index) => {
        try {
          // Read file as base64
          const fileInfo = await FileSystem.getInfoAsync(evidenceItem.uri);
          if (!fileInfo.exists) {
            console.warn(`File not found: ${evidenceItem.uri}`);
            return null;
          }

          const fileData = await FileSystem.readAsStringAsync(evidenceItem.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Generate unique filename
          const fileExtension = evidenceItem.uri.split('.').pop() || 'jpg';
          const fileName = `incident_${incident.id}_evidence_${index + 1}.${fileExtension}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('incident-evidence')
            .upload(fileName, decode(fileData), {
              contentType: `image/${fileExtension}`,
              upsert: false,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
          }

          // Create attachment record
          const { data: attachment, error: attachmentError } = await supabase
            .from('incident_attachments')
            .insert({
              incident_id: incident.id,
              filename: fileName,
              file_path: uploadData.path,
              file_type: 'photo',
              file_size_bytes: fileInfo.size || 0,
              mime_type: `image/${fileExtension}`,
              caption: evidenceItem.caption,
              latitude: currentLocation?.coords.latitude,
              longitude: currentLocation?.coords.longitude,
              uploaded_by: user?.id,
            })
            .select()
            .single();

          if (attachmentError) {
            console.error('Attachment error:', attachmentError);
            return null;
          }

          return attachment;

        } catch (error) {
          console.error('Error uploading evidence:', error);
          return null;
        }
      });

      const attachments = await Promise.all(attachmentPromises);
      const successfulUploads = attachments.filter(Boolean).length;

      console.log(`✅ Incident report created: ${incident.id}`);
      console.log(`📷 Evidence uploaded: ${successfulUploads}/${evidence.length} files`);

      // Show success message
      Alert.alert(
        'Report Submitted',
        `Incident report has been submitted successfully.\n\nReport ID: ${incident.id.slice(0, 8)}\nEvidence: ${successfulUploads} files uploaded`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setCategory('');
              setSeverity('medium');
              setLocationDescription('');
              setEvidence([]);
              setIsEmergency(false);
              setRequiresPolice(false);
              setRequiresMedical(false);
              setRequiresMaintenance(false);
              
              // Navigate back
              navigation.goBack();
            },
          },
        ]
      );

    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Submission Error', 'Failed to submit incident report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Base64 decode helper
  const decode = (base64: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;

    base64 = base64.replace(/[^A-Za-z0-9+/]/g, '');

    while (i < base64.length) {
      const a = chars.indexOf(base64.charAt(i++));
      const b = chars.indexOf(base64.charAt(i++));
      const c = chars.indexOf(base64.charAt(i++));
      const d = chars.indexOf(base64.charAt(i++));

      const bitmap = (a << 18) | (b << 12) | (c << 6) | d;

      const r1 = (bitmap >> 16) & 255;
      const r2 = (bitmap >> 8) & 255;
      const r3 = bitmap & 255;

      result += String.fromCharCode(r1);
      if (c !== 64) result += String.fromCharCode(r2);
      if (d !== 64) result += String.fromCharCode(r3);
    }

    return Uint8Array.from(result, c => c.charCodeAt(0));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Report</Text>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitReport}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.emergencyToggle, isEmergency && styles.emergencyToggleActive]}
            onPress={() => setIsEmergency(!isEmergency)}
          >
            <Ionicons 
              name={isEmergency ? "warning" : "warning-outline"} 
              size={24} 
              color={isEmergency ? "white" : "#ef4444"} 
            />
            <Text style={[
              styles.emergencyText, 
              isEmergency && styles.emergencyTextActive
            ]}>
              {isEmergency ? 'EMERGENCY INCIDENT' : 'Mark as Emergency'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Incident Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Brief description of the incident"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {incidentCategories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  category === cat.value && styles.categoryButtonActive,
                  { borderColor: cat.color }
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={20} 
                  color={category === cat.value ? 'white' : cat.color} 
                />
                <Text style={[
                  styles.categoryButtonText,
                  category === cat.value && styles.categoryButtonTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity */}
        <View style={styles.section}>
          <Text style={styles.label}>Severity</Text>
          <View style={styles.severityButtons}>
            {severityLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityButton,
                  severity === level.value && { backgroundColor: level.color }
                ]}
                onPress={() => setSeverity(level.value)}
              >
                <Text style={[
                  styles.severityButtonText,
                  severity === level.value && styles.severityButtonTextActive
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detailed description of what happened, when, and any relevant details..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location Details</Text>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color="#3b82f6" />
            <Text style={styles.locationText}>
              {currentLocation 
                ? `${currentLocation.coords.latitude.toFixed(6)}, ${currentLocation.coords.longitude.toFixed(6)}`
                : 'Getting location...'
              }
            </Text>
          </View>
          <TextInput
            style={styles.input}
            value={locationDescription}
            onChangeText={setLocationDescription}
            placeholder="Additional location details (e.g., Building A, 2nd floor, near main entrance)"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.label}>Follow-up Required</Text>
          <View style={styles.requirementButtons}>
            <TouchableOpacity
              style={[styles.requirementButton, requiresPolice && styles.requirementButtonActive]}
              onPress={() => setRequiresPolice(!requiresPolice)}
            >
              <Ionicons 
                name={requiresPolice ? "shield" : "shield-outline"} 
                size={16} 
                color={requiresPolice ? "white" : "#3b82f6"} 
              />
              <Text style={[
                styles.requirementButtonText,
                requiresPolice && styles.requirementButtonTextActive
              ]}>
                Police
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.requirementButton, requiresMedical && styles.requirementButtonActive]}
              onPress={() => setRequiresMedical(!requiresMedical)}
            >
              <Ionicons 
                name={requiresMedical ? "medical" : "medical-outline"} 
                size={16} 
                color={requiresMedical ? "white" : "#ef4444"} 
              />
              <Text style={[
                styles.requirementButtonText,
                requiresMedical && styles.requirementButtonTextActive
              ]}>
                Medical
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.requirementButton, requiresMaintenance && styles.requirementButtonActive]}
              onPress={() => setRequiresMaintenance(!requiresMaintenance)}
            >
              <Ionicons 
                name={requiresMaintenance ? "build" : "build-outline"} 
                size={16} 
                color={requiresMaintenance ? "white" : "#f59e0b"} 
              />
              <Text style={[
                styles.requirementButtonText,
                requiresMaintenance && styles.requirementButtonTextActive
              ]}>
                Maintenance
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Evidence */}
        <View style={styles.section}>
          <Text style={styles.label}>Evidence & Photos</Text>
          
          {/* Evidence Actions */}
          <View style={styles.evidenceActions}>
            <TouchableOpacity style={styles.evidenceActionButton} onPress={takePhoto}>
              <Ionicons name="camera" size={20} color="#3b82f6" />
              <Text style={styles.evidenceActionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.evidenceActionButton} onPress={pickImageFromLibrary}>
              <Ionicons name="images" size={20} color="#3b82f6" />
              <Text style={styles.evidenceActionText}>From Library</Text>
            </TouchableOpacity>
          </View>

          {/* Evidence Grid */}
          {evidence.length > 0 && (
            <View style={styles.evidenceGrid}>
              {evidence.map((item, index) => (
                <View key={item.id} style={styles.evidenceItem}>
                  <Image source={{ uri: item.uri }} style={styles.evidenceImage} />
                  <TouchableOpacity
                    style={styles.removeEvidenceButton}
                    onPress={() => removeEvidence(item.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.evidenceCaption}
                    placeholder="Add caption..."
                    value={item.caption}
                    onChangeText={(text) => addEvidenceCaption(item.id, text)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.cameraContainer}>
          <StatusBar style="light" />
          
          {cameraPermission === false ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="camera-outline" size={64} color="#6b7280" />
              <Text style={styles.permissionText}>Camera permission is required</Text>
            </View>
          ) : (
            <>
              <Camera
                style={styles.camera}
                type={cameraType}
                ref={(ref) => {
                  if (ref) {
                    (window as any).cameraRef = ref;
                  }
                }}
              />
              
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.cameraControlButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => {
                    if ((window as any).cameraRef) {
                      capturePhoto((window as any).cameraRef);
                    }
                  }}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cameraControlButton}
                  onPress={() => 
                    setCameraType(
                      cameraType === CameraType.back ? CameraType.front : CameraType.back
                    )
                  }
                >
                  <Ionicons name="camera-reverse" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  emergencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  emergencyToggleActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  emergencyTextActive: {
    color: 'white',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: (width - 64) / 2,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    flexShrink: 1,
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  severityButtonTextActive: {
    color: 'white',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  requirementButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  requirementButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  requirementButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  requirementButtonText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
  },
  requirementButtonTextActive: {
    color: 'white',
  },
  evidenceActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  evidenceActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  evidenceActionText: {
    fontSize: 14,
    color: '#3b82f6',
    marginLeft: 6,
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  evidenceItem: {
    width: (width - 64) / 2,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  evidenceImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  removeEvidenceButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  evidenceCaption: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  bottomSpacing: {
    height: 100,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
  },
  cameraControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
  },
});