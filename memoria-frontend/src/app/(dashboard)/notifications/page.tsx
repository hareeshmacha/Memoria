'use client';

import React, { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import { Bell, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await endpoints.notifications.get();
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic UI update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      await endpoints.notifications.markAsRead(id);
    } catch (err) {
      console.error(err);
      // Revert if failed
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await Promise.all(unread.map(n => endpoints.notifications.markAsRead(n.id)));
    } catch (err) {
      console.error(err);
      fetchNotifications();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Bell className="w-8 h-8 mr-3 text-indigo-500" />
            Notifications
          </h1>
          <p className="text-zinc-400">Updates about your clubs and photos.</p>
        </div>
        
        {notifications.some(n => !n.is_read) && (
          <Button onClick={markAllAsRead} variant="outline" className="border-zinc-700 text-zinc-300">
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Bell className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">You're all caught up!</h2>
          <p className="text-zinc-400 mb-6">You don't have any notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-6 rounded-xl border transition-colors flex items-start justify-between ${n.is_read ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-zinc-900 border-indigo-500/30'}`}
            >
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold mr-4 shrink-0 mt-1">
                  {n.actor?.full_name?.charAt(0) || 'AG'}
                </div>
                <div>
                  <p className={`text-base ${n.is_read ? 'text-zinc-300' : 'text-white font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              {!n.is_read && (
                <button 
                  onClick={() => markAsRead(n.id)}
                  className="w-3 h-3 bg-indigo-500 rounded-full shrink-0 ml-4 mt-2 shadow-[0_0_10px_rgba(99,102,241,0.5)] cursor-pointer hover:bg-indigo-400"
                  title="Mark as read"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
