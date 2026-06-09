'use client';

import React, { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import { ArrowLeft, UploadCloud, Heart, Tag, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function MyAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const statsRes = await endpoints.analytics.getUserAnalytics();
      setStats(statsRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">{error || 'Failed to load analytics'}</h1>
        <Link href={`/dashboard`} className="text-violet-400 hover:text-violet-300">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Uploads', value: stats.totalUploads, icon: UploadCloud, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { name: 'Likes Received', value: stats.totalLikesReceived, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { name: 'Times Tagged', value: stats.totalTags, icon: Tag, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 page-transition">
      <div className="mb-8">
        <Link 
          href={`/dashboard`} 
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-violet-500" />
              My Analytics
            </h1>
            <p className="text-zinc-400 mt-2 font-body">Track your personal engagement and upload history.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="base-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-zinc-400 text-sm font-medium">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="base-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center tracking-tight">
          <TrendingUp className="w-5 h-5 mr-2 text-violet-400" />
          Uploads & Engagement History
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stats.chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dx={-10}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#e4e4e7' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
