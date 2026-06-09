'use client';

import React, { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import { Settings, Loader2, User, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
  const { currentUser, setAuth } = useAuthStore();
  
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize from store once loaded
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setBio(currentUser.bio || '');
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await endpoints.users.updateProfile({ full_name: fullName, bio });
      
      // Update global auth store with new user data
      // We need to pass the existing token to not log them out
      const token = useAuthStore.getState().token;
      if (token) {
        setAuth(token, res.data.data);
      }
      
      setSuccessMsg('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Settings className="w-8 h-8 mr-3 text-zinc-400" />
          Settings
        </h1>
        <p className="text-zinc-400">Manage your account preferences and profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar Nav (Static for now) */}
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center px-4 py-3 bg-indigo-500/10 text-indigo-400 font-medium rounded-lg border border-indigo-500/20">
            <User className="w-5 h-5 mr-3" />
            Public Profile
          </button>
          <button className="w-full flex items-center px-4 py-3 text-zinc-400 hover:bg-zinc-900 font-medium rounded-lg transition-colors">
            <Shield className="w-5 h-5 mr-3" />
            Security
          </button>
        </div>

        {/* Form Area */}
        <div className="col-span-1 md:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Public Profile</h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.username || ''}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500 mt-2">Username cannot be changed once set.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none"
                  placeholder="Tell us a little bit about yourself..."
                />
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-sm">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm">
                  {successMsg}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
