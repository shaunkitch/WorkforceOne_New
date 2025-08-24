import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface GuardKPI {
  checkIns: { current: number; target: number };
  patrols: { current: number; target: number };
  incidents: { current: number; target: number };
  dailyReports: { current: number; target: number };
}

export default function GuardKPIScreen() {
  const [kpis, setKpis] = useState<GuardKPI>({
    checkIns: { current: 0, target: 8 },
    patrols: { current: 0, target: 2 },
    incidents: { current: 0, target: 1 },
    dailyReports: { current: 0, target: 1 }
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadKPIData();
  }, []);

  const loadKPIData = async () => {
    try {
      console.log('🔄 Loading KPI data from database...');

      // Initialize targets and progress data
      let targets = {
        checkIns: 8,
        patrols: 2,
        incidents: 1,
        dailyReports: 1
      };

      let progressData = {
        checkIns: 0,
        patrols: 0,
        incidents: 0,
        dailyReports: 0
      };

      try {
        // Get current user's profile and organization
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log('📱 No authenticated user, using default targets');
          console.log('📱 Auth error:', userError?.message || 'No user session');
        } else {
          console.log('📱 User authenticated:', user.id);
          
          // Get user's profile to find organization
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id, full_name')
            .eq('id', user.id)
            .single();

          console.log('📱 Profile query result:', { profile, error: profileError?.message });

          if (!profileError && profile?.organization_id) {
            console.log('📱 Found organization:', profile.organization_id, 'for user:', profile.full_name);
            
            // Use guard_kpi_targets as SINGLE source of truth (same as admin system)
            console.log('📱 Loading KPI targets from guard_kpi_targets (unified system)...');
            
            // Debug: First check ALL targets for this organization to find missing records
            try {
              console.log('🔍 DEBUG: Querying ALL targets for org:', profile.organization_id);
              const { data: allTargets, error: allError } = await supabase
                .from('guard_kpi_targets')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .order('created_at', { ascending: false });
                
              if (allError) {
                console.log('❌ Debug query error:', allError.message);
              } else if (allTargets) {
                console.log('🔍 ALL targets in organization (' + allTargets.length + ' total):');
                allTargets.forEach(target => {
                  console.log('  -', target.target_type, '=', target.target_value, 
                    '(guard:', target.guard_id || 'org', 
                    'active:', target.is_active, 
                    'period:', target.target_period,
                    'created:', target.created_at, ')');
                });
              } else {
                console.log('⚠️ Debug query returned no data');
              }
            } catch (debugError) {
              console.log('❌ Debug query failed:', debugError.message);
            }
            
            const { data: kpiTargets, error: targetsError } = await supabase
              .from('guard_kpi_targets')
              .select('*')
              .eq('organization_id', profile.organization_id)
              .eq('is_active', true)
              .eq('target_period', 'daily')
              .or('guard_id.is.null,guard_id.eq.' + user.id);
            
            console.log('📱 KPI targets query result:', { 
              targetsFound: kpiTargets?.length || 0, 
              error: targetsError?.message,
              organizationId: profile.organization_id 
            });

            if (kpiTargets && kpiTargets.length > 0) {
              console.log('📊 Raw targets from database:');
              kpiTargets.forEach(target => {
                console.log('  -', target.target_type, '=', target.target_value, '(created:', target.created_at, ')');
              });
            }
            
            if (!targetsError && kpiTargets && kpiTargets.length > 0) {
              // Sort to prioritize: 1) User-specific over org defaults, 2) Most recent first
              const sortedTargets = kpiTargets.sort((a, b) => {
                // First priority: User-specific targets over organization defaults
                if (a.guard_id && !b.guard_id) return -1; // User-specific first
                if (!a.guard_id && b.guard_id) return 1;  // Organization defaults last
                
                // Second priority: Most recent targets first (for same scope)
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              });
              
              // Map targets to our format (take FIRST occurrence of each type = most recent)
              const targetMap = new Map();
              sortedTargets.forEach(target => {
                // Only take the first (most recent) target for each type
                if (!targetMap.has(target.target_type)) {
                  targetMap.set(target.target_type, target.target_value);
                  console.log('📱 Using target:', target.target_type, '=', target.target_value, 'from', target.created_at);
                }
              });
              
              // Apply the loaded targets
              targetMap.forEach((value, type) => {
                switch (type) {
                  case 'check_ins':
                    targets.checkIns = value;
                    break;
                  case 'patrols':
                    targets.patrols = value;
                    break;
                  case 'incidents':
                    targets.incidents = value;
                    break;
                  case 'daily_reports':
                    targets.dailyReports = value;
                    break;
                }
              });
              
              console.log('✅ Successfully loaded KPI targets from guard_kpi_targets (unified):', targets);
              console.log('📊 Applied', kpiTargets.length, 'target configurations');
            } else if (targetsError) {
              console.log('📱 KPI targets query error:', targetsError.message);
            } else {
              console.log('📱 No KPI targets found for organization, using defaults');
              console.log('💡 TIP: Ask your supervisor to create KPI targets at /dashboard/settings/kpi-targets');
            }
          } else if (profileError) {
            console.log('📱 Profile query error:', profileError.message);
          } else {
            console.log('📱 No organization_id found in profile:', profile);
          }
        }
      } catch (fetchError) {
        console.log('📱 Supabase fetch failed:', fetchError.message);
        console.log('📱 Full error:', fetchError);
      }

      // Load actual KPI progress data from individual database tables
      console.log('📱 Loading KPI progress data from database...');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!userError && user) {
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

          // Try to get progress data from guard_kpi_dashboard first (most reliable)
          const { data: dashboardProgress, error: dashboardProgressError } = await supabase
            .from('guard_kpi_dashboard')
            .select('check_ins_today, patrols_today, incidents_today, reports_today')
            .eq('guard_id', user.id)
            .eq('organization_id', profile.organization_id)
            .single();

          if (!dashboardProgressError && dashboardProgress) {
            progressData = {
              checkIns: dashboardProgress.check_ins_today || 0,
              patrols: dashboardProgress.patrols_today || 0,
              incidents: dashboardProgress.incidents_today || 0,
              dailyReports: dashboardProgress.reports_today || 0
            };
            console.log('📊 Progress loaded from dashboard:', progressData);
          } else {
            console.log('📱 Dashboard progress not available, trying individual tables...');
            
            // Fallback: Try individual table queries with better error handling
            try {
              const { data: incidents, error: incidentsError } = await supabase
                .from('security_incidents')
                .select('*')
                .eq('reported_by', user.id)
                .gte('created_at', startOfDay)
                .lt('created_at', endOfDay);

              if (incidentsError) {
                console.log('📱 Security incidents query error:', incidentsError.message);
                console.log('💡 This table may not exist or have different permissions');
              } else if (incidents) {
                progressData.incidents = incidents.length;
                progressData.checkIns = Math.min(incidents.length * 2, 8); // Estimate check-ins
                console.log('📊 Found', incidents.length, 'incidents and estimated', progressData.checkIns, 'check-ins');
              }
            } catch (incidentErr) {
              console.log('📱 Security incidents table access failed:', incidentErr.message);
            }

            try {
              const { data: reports, error: reportsError } = await supabase
                .from('daily_reports')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startOfDay)
                .lt('created_at', endOfDay);

              if (reportsError) {
                console.log('📱 Daily reports query error:', reportsError.message);
                console.log('💡 This table may not exist or have different permissions');
              } else if (reports) {
                progressData.dailyReports = reports.length;
                console.log('📊 Found', reports.length, 'daily reports submitted today');
              }
            } catch (reportsErr) {
              console.log('📱 Daily reports table access failed:', reportsErr.message);
            }
          }
          
          console.log('📊 Progress data loaded from database:', progressData);
        }
      } catch (progressError) {
        console.log('📱 Progress data fetch failed, using defaults:', progressError.message);
      }

      setKpis({
        checkIns: {
          current: progressData.checkIns,
          target: targets.checkIns
        },
        patrols: {
          current: progressData.patrols,
          target: targets.patrols
        },
        incidents: {
          current: progressData.incidents,
          target: targets.incidents
        },
        dailyReports: {
          current: progressData.dailyReports,
          target: targets.dailyReports
        }
      });
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadKPIData();
    setRefreshing(false);
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const getStatusColor = (current: number, target: number): string => {
    const percentage = getProgressPercentage(current, target);
    if (percentage >= 100) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const renderKPICard = (title: string, icon: string, current: number, target: number, color: string) => {
    const percentage = getProgressPercentage(current, target);
    const statusColor = getStatusColor(current, target);

    return (
      <View style={[styles.kpiCard, { borderLeftColor: color }]}>
        <View style={styles.kpiHeader}>
          <Text style={styles.kpiIcon}>{icon}</Text>
          <Text style={styles.kpiTitle}>{title}</Text>
        </View>
        
        <View style={styles.kpiContent}>
          <View style={styles.kpiNumbers}>
            <Text style={[styles.currentValue, { color: statusColor }]}>{current}</Text>
            <Text style={styles.targetValue}>/ {target}</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${percentage}%`, 
                    backgroundColor: statusColor 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
          </View>
        </View>
        
        <Text style={[styles.statusText, { color: statusColor }]}>
          {current >= target ? 'Target Achieved!' : `${target - current} more needed`}
        </Text>
      </View>
    );
  };

  const calculateOverallProgress = (): number => {
    const totalProgress = 
      getProgressPercentage(kpis.checkIns.current, kpis.checkIns.target) +
      getProgressPercentage(kpis.patrols.current, kpis.patrols.target) +
      getProgressPercentage(kpis.incidents.current, kpis.incidents.target) +
      getProgressPercentage(kpis.dailyReports.current, kpis.dailyReports.target);
    
    return Math.round(totalProgress / 4);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <LinearGradient colors={['#8b5cf6', '#a855f7']} style={styles.header}>
          <Text style={styles.headerTitle}>My Performance</Text>
          <Text style={styles.headerSubtitle}>Daily KPI Dashboard</Text>
          <View style={styles.overallProgress}>
            <Text style={styles.overallProgressText}>{calculateOverallProgress()}%</Text>
            <Text style={styles.overallProgressLabel}>Overall Progress</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {renderKPICard('Check-Ins', '📱', kpis.checkIns.current, kpis.checkIns.target, '#7c3aed')}
          {renderKPICard('Patrols', '🚶‍♂️', kpis.patrols.current, kpis.patrols.target, '#10b981')}
          {renderKPICard('Incidents', '🚨', kpis.incidents.current, kpis.incidents.target, '#ef4444')}
          {renderKPICard('Daily Reports', '📋', kpis.dailyReports.current, kpis.dailyReports.target, '#3b82f6')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  header: { 
    padding: 32, 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 8 
  },
  headerSubtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.8)', 
    marginBottom: 20 
  },
  overallProgress: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 120
  },
  overallProgressText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff'
  },
  overallProgressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4
  },
  content: { 
    padding: 20,
    gap: 16
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  kpiIcon: {
    fontSize: 24,
    marginRight: 12
  },
  kpiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    flex: 1
  },
  kpiContent: {
    marginBottom: 12
  },
  kpiNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12
  },
  currentValue: {
    fontSize: 36,
    fontWeight: 'bold'
  },
  targetValue: {
    fontSize: 20,
    color: '#6b7280',
    marginLeft: 4
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 40
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  }
});