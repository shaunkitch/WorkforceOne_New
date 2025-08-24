import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserProfile } from '../lib/supabase';
import { getAvailableProducts, getPrimaryProduct, getProductTheme } from '../lib/products';
import { getCurrentUserProfile, canViewAllData, getDataScope, UserProfile } from '../lib/rbac';

const { width } = Dimensions.get('window');

interface Props {
  userProducts: string[];
}

export default function UnifiedDashboardScreen({ userProducts }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});

  const availableProducts = getAvailableProducts(userProducts);
  const primaryProduct = getPrimaryProduct(userProducts);
  const theme = getProductTheme(userProducts);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { profile } = await getUserProfile();
      const rbacProfile = await getCurrentUserProfile();
      setProfile(profile);
      setUserProfile(rbacProfile);
      
      // RBAC-based stats loading
      if (rbacProfile) {
        const dataScope = getDataScope(rbacProfile);
        const canViewAll = canViewAllData(rbacProfile);
        
        // Load stats based on user's role and data scope
        const roleBasedStats = await loadRoleBasedStats(rbacProfile, dataScope, canViewAll);
        setStats(roleBasedStats);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadRoleBasedStats = async (userProfile: UserProfile, dataScope: string, canViewAll: boolean) => {
    const stats: Record<string, any> = {};
    
    // Guards only see their own data
    if (userProfile.role === 'guard') {
      stats['guard-management'] = {
        myShifts: 5,
        myIncidents: 2,
        hoursWorked: 38.5,
        nextShift: 'Tomorrow 8:00 AM'
      };
    }
    
    // Employees see their own workforce and time data
    if (userProfile.role === 'employee') {
      stats['workforce-management'] = {
        myProjects: 3,
        myTasks: 12,
        completedTasks: 8
      };
      stats['time-tracker'] = {
        hoursToday: 6.5,
        hoursWeek: 32.5,
        productivity: 92
      };
    }
    
    // Supervisors see team data
    if (userProfile.role === 'supervisor') {
      stats['workforce-management'] = {
        teamMembers: 8,
        teamProjects: 4,
        teamCompletion: 78
      };
      stats['guard-management'] = {
        teamGuards: 6,
        activePatrols: 2,
        incidents: 1
      };
    }
    
    // Managers and above see organization data
    if (['manager', 'organization_admin', 'super_admin'].includes(userProfile.role)) {
      stats['workforce-management'] = {
        employees: canViewAll ? 127 : 45,
        projects: canViewAll ? 15 : 8,
        completion: 85
      };
      stats['time-tracker'] = {
        totalHours: canViewAll ? 2340 : 850,
        avgProductivity: 89,
        activeUsers: canViewAll ? 45 : 20
      };
      stats['guard-management'] = {
        guards: canViewAll ? 24 : 12,
        sites: canViewAll ? 8 : 4,
        coverage: 96
      };
    }
    
    return stats;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderWelcomeHeader = () => (
    <LinearGradient
      colors={theme.gradient}
      style={styles.headerContainer}
    >
      <View style={styles.headerContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>
            {profile?.full_name || 'User'}! 👋
          </Text>
          <Text style={styles.subtitle}>
            {userProfile ? `${userProfile.role.replace('_', ' ').toUpperCase()} • ${availableProducts.length} product${availableProducts.length !== 1 ? 's' : ''}` : 'Loading...'}
          </Text>
          {userProfile && (
            <Text style={styles.roleDescription}>
              {getRoleDescription(userProfile.role)}
            </Text>
          )}
        </View>
        
        <View style={styles.productBadges}>
          {availableProducts.slice(0, 3).map((product, index) => (
            <View
              key={product.id}
              style={[styles.productBadge, { marginLeft: index * 8 }]}
            >
              <Text style={styles.productBadgeIcon}>{product.icon}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  const getRoleDescription = (role: string): string => {
    switch (role) {
      case 'guard': return 'Access to your patrol data and incidents';
      case 'employee': return 'Access to your tasks and time tracking';
      case 'supervisor': return 'Access to your team data and reports';
      case 'manager': return 'Access to organization management';
      case 'organization_admin': return 'Full organization access and control';
      case 'super_admin': return 'Global system administration';
      default: return 'User access';
    }
  };

  const renderWorkforceStats = (productStats: any) => {
    if (!userProfile) return null;
    
    if (userProfile.role === 'employee') {
      return (
        <>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.myTasks || 0}</Text>
            <Text style={styles.statText}>My Tasks</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.completedTasks || 0}</Text>
            <Text style={styles.statText}>Completed</Text>
          </View>
        </>
      );
    }
    
    if (userProfile.role === 'supervisor') {
      return (
        <>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.teamMembers || 0}</Text>
            <Text style={styles.statText}>Team</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.teamProjects || 0}</Text>
            <Text style={styles.statText}>Projects</Text>
          </View>
        </>
      );
    }
    
    // Managers and above
    return (
      <>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>{productStats.employees || 0}</Text>
          <Text style={styles.statText}>Employees</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>{productStats.projects || 0}</Text>
          <Text style={styles.statText}>Projects</Text>
        </View>
      </>
    );
  };

  const renderTimeTrackerStats = (productStats: any) => {
    if (!userProfile) return null;
    
    if (['employee', 'guard'].includes(userProfile.role)) {
      return (
        <>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.hoursToday || 0}h</Text>
            <Text style={styles.statText}>Today</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.productivity || 0}%</Text>
            <Text style={styles.statText}>Productivity</Text>
          </View>
        </>
      );
    }
    
    // Supervisors and above see aggregated data
    return (
      <>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>{productStats.totalHours || 0}</Text>
          <Text style={styles.statText}>Total Hours</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>{productStats.activeUsers || 0}</Text>
          <Text style={styles.statText}>Active Users</Text>
        </View>
      </>
    );
  };

  const renderGuardStats = (productStats: any) => {
    if (!userProfile) return null;
    
    if (userProfile.role === 'guard') {
      return (
        <>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.myShifts || 0}</Text>
            <Text style={styles.statText}>My Shifts</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.myIncidents || 0}</Text>
            <Text style={styles.statText}>Incidents</Text>
          </View>
        </>
      );
    }
    
    if (userProfile.role === 'supervisor') {
      return (
        <>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.teamGuards || 0}</Text>
            <Text style={styles.statText}>Team Guards</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{productStats.activePatrols || 0}</Text>
            <Text style={styles.statText}>Active</Text>
          </View>
        </>
      );
    }
    
    // Managers and above
    return (
      <>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>{productStats.guards || 0}</Text>
          <Text style={styles.statText}>Guards</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>{productStats.coverage || 0}%</Text>
          <Text style={styles.statText}>Coverage</Text>
        </View>
      </>
    );
  };

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <Text style={styles.sectionTitle}>Quick Overview</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>{availableProducts.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>Active</Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>94%</Text>
          <Text style={styles.statLabel}>Performance</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
    </View>
  );

  const renderProductCards = () => (
    <View style={styles.productCardsContainer}>
      <Text style={styles.sectionTitle}>Your Products</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productCardsScroll}
      >
        {availableProducts.map((product) => {
          const productStats = stats[product.id] || {};
          
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={product.color.gradient}
                style={styles.productCardGradient}
              >
                <View style={styles.productCardHeader}>
                  <Text style={styles.productCardIcon}>{product.icon}</Text>
                  <Text style={styles.productCardTitle}>{product.name}</Text>
                </View>
                
                <Text style={styles.productCardDescription}>
                  {product.description}
                </Text>
                
                {/* Role-based product stats */}
                <View style={styles.productCardStats}>
                  {product.id === 'workforce-management' && renderWorkforceStats(productStats)}
                  {product.id === 'time-tracker' && renderTimeTrackerStats(productStats)}
                  {product.id === 'guard-management' && renderGuardStats(productStats)}
                </View>
                
                <TouchableOpacity style={styles.openButton}>
                  <Text style={styles.openButtonText}>Open {product.name}</Text>
                  <Text style={styles.openButtonIcon}>→</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        {[
          { icon: '👥', action: 'Signed in', product: 'Workforce Management', time: '2 mins ago' },
          { icon: '⏱️', action: 'Started timer', product: 'Time Tracker', time: '15 mins ago' },
          { icon: '🛡️', action: 'Viewed sites', product: 'Guard Management', time: '1 hour ago' },
          { icon: '📊', action: 'Generated report', product: 'Workforce Management', time: '2 hours ago' },
        ].map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>{activity.icon}</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityAction}>{activity.action}</Text>
              <Text style={styles.activityProduct}>{activity.product}</Text>
            </View>
            <Text style={styles.activityTime}>{activity.time}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderWelcomeHeader()}
        {renderQuickStats()}
        {renderProductCards()}
        {renderRecentActivity()}
        
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
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 32,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  roleDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  productBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  productBadgeIcon: {
    fontSize: 16,
  },
  quickStatsContainer: {
    paddingHorizontal: 20,
    marginTop: -16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  productCardsContainer: {
    marginBottom: 24,
  },
  productCardsScroll: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  productCard: {
    width: width * 0.8,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  productCardGradient: {
    padding: 20,
  },
  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productCardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  productCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  productCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  productCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  openButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
    marginLeft: 8,
  },
  openButtonIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activityContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    lineHeight: 18,
  },
  activityProduct: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    minWidth: 70,
    lineHeight: 16,
  },
  bottomPadding: {
    height: 32,
  },
});