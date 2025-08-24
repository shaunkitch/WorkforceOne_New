import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function WorkforceDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const quickActions = [
    { id: 'employees', title: 'Employees', icon: '👤', count: 127, color: '#3b82f6' },
    { id: 'projects', title: 'Projects', icon: '📁', count: 15, color: '#10b981' },
    { id: 'teams', title: 'Teams', icon: '👥', count: 8, color: '#f59e0b' },
    { id: 'analytics', title: 'Analytics', icon: '📈', count: '85%', color: '#8b5cf6' },
  ];

  const recentProjects = [
    { name: 'Website Redesign', progress: 75, team: 8, status: 'In Progress' },
    { name: 'Mobile App Dev', progress: 45, team: 12, status: 'Planning' },
    { name: 'Data Migration', progress: 100, team: 5, status: 'Completed' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={['#059669', '#10b981']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Workforce Management</Text>
            <Text style={styles.headerSubtitle}>
              Manage your team and projects efficiently
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.color }]}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionCount}>{action.count}</Text>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Projects */}
        <View style={styles.projectsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Projects</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentProjects.map((project, index) => (
            <TouchableOpacity key={index} style={styles.projectCard}>
              <View style={styles.projectHeader}>
                <Text style={styles.projectName}>{project.name}</Text>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: project.status === 'Completed' ? '#10b981' :
                                   project.status === 'In Progress' ? '#3b82f6' : '#f59e0b'
                  }
                ]}>
                  <Text style={styles.statusText}>{project.status}</Text>
                </View>
              </View>
              
              <View style={styles.projectInfo}>
                <View style={styles.projectInfoItem}>
                  <Text style={styles.projectInfoLabel}>Team Size</Text>
                  <Text style={styles.projectInfoValue}>{project.team} members</Text>
                </View>
                <View style={styles.projectInfoItem}>
                  <Text style={styles.projectInfoLabel}>Progress</Text>
                  <Text style={styles.projectInfoValue}>{project.progress}%</Text>
                </View>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${project.progress}%`, backgroundColor: '#059669' }
                    ]} 
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.actionButtonIcon}>👤</Text>
              <Text style={styles.actionButtonText}>Add Employee</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10b981' }]}>
              <Text style={styles.actionButtonIcon}>📁</Text>
              <Text style={styles.actionButtonText}>New Project</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.actionButtonIcon}>👥</Text>
              <Text style={styles.actionButtonText}>Create Team</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 32,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: -16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  quickActionCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  projectsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  seeAllText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  projectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectInfoItem: {
    flex: 1,
  },
  projectInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  projectInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 32,
  },
});