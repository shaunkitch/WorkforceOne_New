'use client';

import React, { useState, useEffect } from 'react';
import { devLog } from '@/lib/utils/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Users,
  MapPin,
  Clock,
  Activity,
  Award,
  Target,
  Calendar,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export default function SecurityAnalytics() {
  const supabase = createClient();
  
  // State management
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Mock data for demonstration
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    { label: 'Response Time', value: 3.2, change: -12, trend: 'down', unit: 'min' },
    { label: 'Incidents Resolved', value: 156, change: 8, trend: 'up' },
    { label: 'Patrol Completion', value: 94, change: 2, trend: 'up', unit: '%' },
    { label: 'Guard Efficiency', value: 87, change: -3, trend: 'down', unit: '%' },
  ]);

  // Incident trends data
  const incidentTrendsData: ChartData[] = [
    { name: 'Mon', critical: 2, high: 4, medium: 8, low: 12 },
    { name: 'Tue', critical: 1, high: 3, medium: 10, low: 15 },
    { name: 'Wed', critical: 3, high: 5, medium: 7, low: 11 },
    { name: 'Thu', critical: 0, high: 2, medium: 9, low: 14 },
    { name: 'Fri', critical: 1, high: 4, medium: 11, low: 16 },
    { name: 'Sat', critical: 2, high: 3, medium: 6, low: 9 },
    { name: 'Sun', critical: 1, high: 2, medium: 5, low: 8 },
  ];

  // Response time data
  const responseTimeData: ChartData[] = [
    { name: '00:00', avgTime: 4.2 },
    { name: '04:00', avgTime: 3.8 },
    { name: '08:00', avgTime: 3.5 },
    { name: '12:00', avgTime: 2.9 },
    { name: '16:00', avgTime: 3.2 },
    { name: '20:00', avgTime: 3.7 },
  ];

  // Incident categories
  const incidentCategoriesData: ChartData[] = [
    { name: 'Unauthorized Access', value: 35, percentage: 28 },
    { name: 'Security Breach', value: 25, percentage: 20 },
    { name: 'Equipment Malfunction', value: 20, percentage: 16 },
    { name: 'Suspicious Activity', value: 18, percentage: 14 },
    { name: 'Fire/Safety', value: 15, percentage: 12 },
    { name: 'Medical Emergency', value: 12, percentage: 10 },
  ];

  // Guard performance data
  const guardPerformanceData: ChartData[] = [
    { name: 'John Smith', patrols: 48, incidents: 12, checkpoints: 384, efficiency: 92 },
    { name: 'Mike Johnson', patrols: 45, incidents: 8, checkpoints: 360, efficiency: 88 },
    { name: 'Sarah Williams', patrols: 50, incidents: 15, checkpoints: 400, efficiency: 95 },
    { name: 'Tom Brown', patrols: 42, incidents: 6, checkpoints: 336, efficiency: 85 },
    { name: 'Lisa Davis', patrols: 47, incidents: 10, checkpoints: 376, efficiency: 90 },
  ];

  // Patrol compliance data
  const patrolComplianceData: ChartData[] = [
    { time: 'Week 1', completed: 92, missed: 8 },
    { time: 'Week 2', completed: 88, missed: 12 },
    { time: 'Week 3', completed: 94, missed: 6 },
    { time: 'Week 4', completed: 90, missed: 10 },
  ];

  // Heat map data for incidents by hour and day
  const incidentHeatmapData = [
    { day: 'Mon', hour: '00-06', incidents: 2 },
    { day: 'Mon', hour: '06-12', incidents: 5 },
    { day: 'Mon', hour: '12-18', incidents: 8 },
    { day: 'Mon', hour: '18-24', incidents: 4 },
    { day: 'Tue', hour: '00-06', incidents: 1 },
    { day: 'Tue', hour: '06-12', incidents: 6 },
    { day: 'Tue', hour: '12-18', incidents: 10 },
    { day: 'Tue', hour: '18-24', incidents: 5 },
    // ... more data
  ];

  const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedMetric]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simulate loading data
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In production, fetch real data from database
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Generate and download report
    devLog('Exporting analytics report...');
    alert('Analytics report will be downloaded');
  };

  const getMetricIcon = (trend: string) => {
    return trend === 'up' ? (
      <ChevronUp className="h-4 w-4 text-green-500" />
    ) : trend === 'down' ? (
      <ChevronDown className="h-4 w-4 text-red-500" />
    ) : (
      <Activity className="h-4 w-4 text-gray-500" />
    );
  };

  const getMetricColor = (trend: string, change: number) => {
    if (trend === 'up') return change > 0 ? 'text-green-600' : 'text-red-600';
    if (trend === 'down') return change < 0 ? 'text-green-600' : 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Analytics</h2>
          <p className="text-muted-foreground">Performance metrics and insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter metrics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="incidents">Incidents</SelectItem>
              <SelectItem value="patrols">Patrols</SelectItem>
              <SelectItem value="guards">Guards</SelectItem>
              <SelectItem value="response">Response</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              {getMetricIcon(metric.trend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit || ''}
              </div>
              <p className={`text-xs ${getMetricColor(metric.trend, metric.change)}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}% from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Incident Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Trends by Severity</CardTitle>
            <CardDescription>Daily incident distribution by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={incidentTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#EF4444" fill="#EF4444" />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#10B981" fill="#10B981" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Average Response Time</CardTitle>
            <CardDescription>Response time trends throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgTime" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Avg Response Time"
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey={() => 3.5}
                  stroke="#10B981"
                  strokeDasharray="5 5"
                  name="Target (3.5 min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Incident Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Categories</CardTitle>
            <CardDescription>Breakdown of incidents by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incidentCategoriesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incidentCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Guard Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Guard Performance</CardTitle>
            <CardDescription>Guard efficiency ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={guardPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="efficiency" fill="#10B981" name="Efficiency %" />
                <Bar dataKey="patrols" fill="#3B82F6" name="Patrols" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Patrol Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Patrol Compliance Overview</CardTitle>
          <CardDescription>Weekly patrol completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={patrolComplianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed %" />
              <Bar dataKey="missed" stackId="a" fill="#EF4444" name="Missed %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Guard Statistics</CardTitle>
          <CardDescription>Individual guard performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Guard Name</th>
                  <th className="text-center p-2">Patrols</th>
                  <th className="text-center p-2">Incidents</th>
                  <th className="text-center p-2">Checkpoints</th>
                  <th className="text-center p-2">Efficiency</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {guardPerformanceData.map((guard, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{guard.name}</td>
                    <td className="text-center p-2">{guard.patrols}</td>
                    <td className="text-center p-2">{guard.incidents}</td>
                    <td className="text-center p-2">{guard.checkpoints}</td>
                    <td className="text-center p-2">
                      <Badge 
                        className={
                          guard.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                          guard.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {guard.efficiency}%
                      </Badge>
                    </td>
                    <td className="text-center p-2">
                      <Badge variant="outline">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            AI-Powered Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
              <div>
                <p className="font-medium text-blue-900">Peak Incident Hours</p>
                <p className="text-sm text-blue-700">
                  Most incidents occur between 12:00-18:00. Consider increasing patrol frequency during these hours.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
              <div>
                <p className="font-medium text-blue-900">Response Time Improvement</p>
                <p className="text-sm text-blue-700">
                  Response times have improved by 12% this week. Maintain current dispatch protocols.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
              <div>
                <p className="font-medium text-blue-900">Training Recommendation</p>
                <p className="text-sm text-blue-700">
                  Guards with lower efficiency scores should receive additional training on checkpoint procedures.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
              <div>
                <p className="font-medium text-blue-900">Equipment Maintenance Alert</p>
                <p className="text-sm text-blue-700">
                  Equipment malfunction incidents increased by 20%. Schedule preventive maintenance checks.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}