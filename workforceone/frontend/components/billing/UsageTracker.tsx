'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, Shield, TrendingUp, AlertCircle } from 'lucide-react';

interface UsageData {
  product: {
    code: string;
    name: string;
    displayName: string;
  };
  subscription: {
    userCount: number;
    unitPrice: number;
    status: string;
  };
  currentUsage: {
    activeUsers: number;
    monthlyUsage: number;
  };
  features: {
    name: string;
    used: number;
    limit: number | null; // null means unlimited
  }[];
}

const UsageTracker: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      // TODO: Replace with actual API call
      const mockData: UsageData[] = [
        {
          product: {
            code: 'remote',
            name: 'WorkforceOne Remote',
            displayName: 'Remote'
          },
          subscription: {
            userCount: 25,
            unitPrice: 8.00,
            status: 'active'
          },
          currentUsage: {
            activeUsers: 23,
            monthlyUsage: 2847
          },
          features: [
            { name: 'Active Teams', used: 8, limit: null },
            { name: 'Tasks Created', used: 342, limit: null },
            { name: 'Forms Submitted', used: 156, limit: null },
            { name: 'Routes Tracked', used: 45, limit: null }
          ]
        },
        {
          product: {
            code: 'time',
            name: 'WorkforceOne Time',
            displayName: 'Time'
          },
          subscription: {
            userCount: 25,
            unitPrice: 6.00,
            status: 'active'
          },
          currentUsage: {
            activeUsers: 25,
            monthlyUsage: 1923
          },
          features: [
            { name: 'Clock Entries', used: 486, limit: null },
            { name: 'Leave Requests', used: 23, limit: null },
            { name: 'Timesheets', used: 125, limit: null },
            { name: 'Payroll Exports', used: 4, limit: null }
          ]
        },
        {
          product: {
            code: 'guard',
            name: 'WorkforceOne Guard',
            displayName: 'Guard'
          },
          subscription: {
            userCount: 15,
            unitPrice: 12.00,
            status: 'active'
          },
          currentUsage: {
            activeUsers: 12,
            monthlyUsage: 1456
          },
          features: [
            { name: 'Patrol Sessions', used: 89, limit: null },
            { name: 'Checkpoints Scanned', used: 534, limit: null },
            { name: 'Incidents Reported', used: 7, limit: null },
            { name: 'GPS Tracks', used: 2340, limit: null }
          ]
        }
      ];
      setUsageData(mockData);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = (code: string) => {
    switch (code) {
      case 'remote':
        return <Users className="h-5 w-5" />;
      case 'time':
        return <Clock className="h-5 w-5" />;
      case 'guard':
        return <Shield className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (limit === null) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalMonthlySpend = usageData.reduce(
    (total, data) => total + (data.subscription.userCount * data.subscription.unitPrice), 
    0
  );
  const totalActiveUsers = usageData.reduce(
    (total, data) => total + data.currentUsage.activeUsers, 
    0
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">Usage & Analytics</h2>
        <p className="text-gray-600">
          Monitor your WorkforceOne product usage and optimize your subscription.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Spend</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalMonthlySpend.toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalActiveUsers}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Products Active</p>
              <p className="text-2xl font-bold text-gray-900">{usageData.length}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Usage Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {usageData.map((data) => {
          const utilizationRate = (data.currentUsage.activeUsers / data.subscription.userCount) * 100;
          const isUnderUtilized = utilizationRate < 75;
          
          return (
            <div key={data.product.code} className="bg-white border border-gray-200 rounded-lg">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      {getProductIcon(data.product.code)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{data.product.displayName}</h3>
                      <p className="text-sm text-gray-600">
                        ${data.subscription.unitPrice}/user/month
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Monthly Cost</p>
                    <p className="font-semibold">
                      ${(data.subscription.userCount * data.subscription.unitPrice).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* User Utilization */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>User Utilization</span>
                    <span>
                      {data.currentUsage.activeUsers}/{data.subscription.userCount} users
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isUnderUtilized ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {utilizationRate.toFixed(1)}% utilization
                  </p>
                </div>

                {isUnderUtilized && (
                  <div className="flex items-center mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                    <p className="text-xs text-yellow-800">
                      Consider reducing user count to optimize costs
                    </p>
                  </div>
                )}
              </div>

              {/* Feature Usage */}
              <div className="p-6">
                <h4 className="font-medium mb-3">Feature Usage This Month</h4>
                <div className="space-y-3">
                  {data.features.map((feature, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{feature.name}</span>
                        <span>
                          {feature.used.toLocaleString()}
                          {feature.limit && ` / ${feature.limit.toLocaleString()}`}
                        </span>
                      </div>
                      {feature.limit && (
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${getUsageColor(
                              getUsagePercentage(feature.used, feature.limit)
                            )}`}
                            style={{
                              width: `${getUsagePercentage(feature.used, feature.limit)}%`
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optimization Suggestions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Optimization Suggestions</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {usageData.some(d => (d.currentUsage.activeUsers / d.subscription.userCount) < 0.75) && (
            <li>• Consider reducing user counts on underutilized products to save costs</li>
          )}
          <li>• You're using {usageData.length} of 3 products - upgrade to all 3 for 23% bundle savings</li>
          <li>• Annual billing would save you 20% compared to monthly billing</li>
        </ul>
      </div>
    </div>
  );
};

export default UsageTracker;