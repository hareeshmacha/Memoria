'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Users, Settings, Activity, ShieldAlert } from 'lucide-react';

export default function PlatformAdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Basic protection (Ideally backend also checks this and we have a proper HOC)
    if (isAuthenticated && user && !user.is_admin) {
      router.push('/dashboard');
    }
  }, [user, isAuthenticated, router]);

  if (!user?.is_admin) {
    return null; // or a loading spinner
  }

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Platform Admin</h1>
        <p className="text-zinc-400">Manage platform settings, users, and view system health.</p>
      </div>

      <div className="border-b border-white/10">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  ${isActive 
                    ? 'border-cyan-500 text-cyan-400' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-300'}
                `}
              >
                <Icon className={`w-5 h-5 mr-2 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="base-card p-6 border-cyan-500/20">
              <h3 className="text-sm font-medium text-zinc-400">Total Users</h3>
              <p className="text-3xl font-bold text-white mt-2">1,234</p>
            </div>
            <div className="base-card p-6 border-violet-500/20">
              <h3 className="text-sm font-medium text-zinc-400">Active Clubs</h3>
              <p className="text-3xl font-bold text-white mt-2">56</p>
            </div>
            <div className="base-card p-6 border-emerald-500/20">
              <h3 className="text-sm font-medium text-zinc-400">Media Processed</h3>
              <p className="text-3xl font-bold text-white mt-2">89.2k</p>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="base-card p-6">
            <h3 className="text-lg font-medium text-white mb-4">User Management</h3>
            <p className="text-zinc-400 text-sm">User list will be displayed here.</p>
          </div>
        )}
        
        {activeTab === 'audit' && (
          <div className="base-card p-6">
            <h3 className="text-lg font-medium text-white mb-4">Security Audit Logs</h3>
            <p className="text-zinc-400 text-sm">Audit trail will be displayed here.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="base-card p-6">
            <h3 className="text-lg font-medium text-white mb-4">Platform Settings</h3>
            <p className="text-zinc-400 text-sm">Global configurations will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
