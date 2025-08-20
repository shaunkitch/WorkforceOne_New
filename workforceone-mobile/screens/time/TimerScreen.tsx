import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TimerScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState('00:00:00');

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerDisplay}>{time}</Text>
        <Text style={styles.projectName}>Website Redesign</Text>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: isRunning ? '#ef4444' : '#10b981' }]}
            onPress={handleStartStop}
          >
            <Text style={styles.controlButtonText}>
              {isRunning ? '⏸️ Pause' : '▶️ Start'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: '#6b7280' }]}>
            <Text style={styles.controlButtonText}>⏹️ Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  timerContainer: { alignItems: 'center' },
  timerDisplay: { fontSize: 64, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  projectName: { fontSize: 18, color: '#6b7280', marginBottom: 48 },
  controls: { flexDirection: 'row', gap: 16 },
  controlButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  controlButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});