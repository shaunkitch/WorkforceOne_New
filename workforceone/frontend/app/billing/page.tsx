'use client';

import React, { useState } from 'react';
import { CreditCard, BarChart3, Settings } from 'lucide-react';
import SubscriptionManager from '@/components/billing/SubscriptionManager';
import UsageTracker from '@/components/billing/UsageTracker';

type BillingTab = 'subscriptions' | 'usage' | 'settings';

const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BillingTab>('subscriptions');

  const tabs: { id: BillingTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: <CreditCard className="h-4 w-4" />
    },
    {
      id: 'usage',
      label: 'Usage & Analytics',
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      id: 'settings',
      label: 'Billing Settings',
      icon: <Settings className="h-4 w-4" />
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'subscriptions':
        return <SubscriptionManager />;
      case 'usage':
        return <UsageTracker />;
      case 'settings':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Billing Settings
              </h3>
              <p className="text-gray-600 mb-6">
                Manage payment methods, billing address, and invoicing preferences.
              </p>
              <p className="text-sm text-gray-500">
                This section will be implemented in a future update.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
          <p className="text-gray-600 mt-1">
            Manage your WorkforceOne products, usage, and billing settings
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default BillingPage;