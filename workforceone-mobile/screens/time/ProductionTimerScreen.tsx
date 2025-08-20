import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  taskName: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  notes: string;
  date: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  tasks: string[];
}

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Website Redesign', color: '#3b82f6', tasks: ['Frontend', 'Backend', 'Testing'] },
  { id: '2', name: 'Mobile App', color: '#10b981', tasks: ['UI Design', 'API Integration', 'Bug Fixes'] },
  { id: '3', name: 'Database Migration', color: '#f59e0b', tasks: ['Schema Design', 'Data Transfer', 'Validation'] },
];

export default function ProductionTimerScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project>(MOCK_PROJECTS[0]);
  const [selectedTask, setSelectedTask] = useState('');
  const [notes, setNotes] = useState('');
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<string>('');

  useEffect(() => {
    loadTodayEntries();
    checkActiveTimer();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const loadTodayEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem('timeEntries');
      if (stored) {
        const entries: TimeEntry[] = JSON.parse(stored);
        const today = new Date().toDateString();
        const todayData = entries.filter(e => new Date(e.date).toDateString() === today);
        setTodayEntries(todayData);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const checkActiveTimer = async () => {
    try {
      const activeTimer = await AsyncStorage.getItem('activeTimer');
      if (activeTimer) {
        const data = JSON.parse(activeTimer);
        setSelectedProject(data.project);
        setSelectedTask(data.task);
        setNotes(data.notes || '');
        startTimeRef.current = data.startTime;
        
        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000);
        setSeconds(elapsed);
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const handleStart = async () => {
    if (!selectedTask) {
      Alert.alert('Select Task', 'Please select a task before starting the timer');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const startTime = new Date().toISOString();
    startTimeRef.current = startTime;
    
    // Save active timer
    await AsyncStorage.setItem('activeTimer', JSON.stringify({
      project: selectedProject,
      task: selectedTask,
      notes,
      startTime,
    }));

    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(!isPaused);
  };

  const handleStop = async () => {
    if (seconds < 60) {
      Alert.alert(
        'Short Entry',
        'This entry is less than a minute. Do you want to save it?',
        [
          { text: 'Discard', style: 'destructive', onPress: handleDiscard },
          { text: 'Save', onPress: () => saveEntry() }
        ]
      );
    } else {
      await saveEntry();
    }
  };

  const saveEntry = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const entry: TimeEntry = {
      id: `time-${Date.now()}`,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      taskName: selectedTask,
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      duration: seconds,
      notes,
      date: new Date().toISOString(),
    };

    try {
      // Save to storage
      const stored = await AsyncStorage.getItem('timeEntries');
      const entries = stored ? JSON.parse(stored) : [];
      entries.unshift(entry);
      await AsyncStorage.setItem('timeEntries', JSON.stringify(entries));
      
      // Clear active timer
      await AsyncStorage.removeItem('activeTimer');
      
      // Update today's entries
      setTodayEntries([entry, ...todayEntries]);
      
      // Reset timer
      resetTimer();
      
      Alert.alert('Time Saved', `${formatTime(seconds)} logged for ${selectedProject.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save time entry');
    }
  };

  const handleDiscard = async () => {
    await AsyncStorage.removeItem('activeTimer');
    resetTimer();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setSeconds(0);
    setNotes('');
    startTimeRef.current = '';
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalToday = (): number => {
    return todayEntries.reduce((total, entry) => total + entry.duration, 0);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#3b82f6', '#60a5fa']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Time Tracker</Text>
        <Text style={styles.timerDisplay}>{formatTime(seconds)}</Text>
        
        {isRunning && (
          <View style={styles.currentTaskInfo}>
            <Text style={styles.currentProject}>{selectedProject.name}</Text>
            <Text style={styles.currentTask}>{selectedTask}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Project & Task Selection */}
      {!isRunning && (
        <View style={styles.selectionContainer}>
          <Text style={styles.sectionTitle}>Select Project & Task</Text>
          
          <TouchableOpacity
            style={[styles.projectSelector, { borderColor: selectedProject.color }]}
            onPress={() => setShowProjectPicker(!showProjectPicker)}
          >
            <View style={[styles.projectIndicator, { backgroundColor: selectedProject.color }]} />
            <Text style={styles.projectName}>{selectedProject.name}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          {showProjectPicker && (
            <View style={styles.projectPicker}>
              {MOCK_PROJECTS.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectOption}
                  onPress={() => {
                    setSelectedProject(project);
                    setSelectedTask('');
                    setShowProjectPicker(false);
                  }}
                >
                  <View style={[styles.projectIndicator, { backgroundColor: project.color }]} />
                  <Text style={styles.projectOptionText}>{project.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.taskGrid}>
            {selectedProject.tasks.map((task) => (
              <TouchableOpacity
                key={task}
                style={[
                  styles.taskButton,
                  selectedTask === task && styles.taskButtonSelected,
                ]}
                onPress={() => setSelectedTask(task)}
              >
                <Text style={[
                  styles.taskButtonText,
                  selectedTask === task && styles.taskButtonTextSelected,
                ]}>
                  {task}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Add notes (optional)"
            placeholderTextColor="#9ca3af"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />
        </View>
      )}

      {/* Timer Controls */}
      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity
            style={[styles.controlButton, styles.startButton]}
            onPress={handleStart}
          >
            <LinearGradient
              colors={['#10b981', '#34d399']}
              style={styles.buttonGradient}
            >
              <Text style={styles.controlIcon}>▶️</Text>
              <Text style={styles.controlText}>Start Timer</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]}
              onPress={handlePause}
            >
              <Text style={styles.controlIcon}>{isPaused ? '▶️' : '⏸️'}</Text>
              <Text style={styles.controlText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStop}
            >
              <Text style={styles.controlIcon}>⏹️</Text>
              <Text style={styles.controlText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Today's Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(getTotalToday())}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayEntries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {todayEntries.length > 0 
                ? formatTime(Math.floor(getTotalToday() / todayEntries.length))
                : '00:00:00'}
            </Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
        </View>
      </View>

      {/* Recent Entries */}
      <View style={styles.entriesSection}>
        <Text style={styles.sectionTitle}>Today's Entries</Text>
        {todayEntries.length === 0 ? (
          <Text style={styles.emptyMessage}>No entries yet today</Text>
        ) : (
          todayEntries.slice(0, 5).map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryProject}>{entry.projectName}</Text>
                <Text style={styles.entryDuration}>{formatTime(entry.duration)}</Text>
              </View>
              <Text style={styles.entryTask}>{entry.taskName}</Text>
              {entry.notes ? (
                <Text style={styles.entryNotes}>{entry.notes}</Text>
              ) : null}
              <Text style={styles.entryTime}>
                {new Date(entry.startTime).toLocaleTimeString()} - 
                {entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : 'In Progress'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  currentTaskInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  currentProject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  currentTask: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  projectIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  projectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6b7280',
  },
  projectPicker: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  projectOptionText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  taskButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  taskButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  taskButtonTextSelected: {
    color: '#ffffff',
  },
  notesInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  controls: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  controlButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButton: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  buttonGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  controlIcon: {
    fontSize: 24,
  },
  controlText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  entriesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    paddingVertical: 32,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  entryDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  entryTask: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  entryNotes: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
});