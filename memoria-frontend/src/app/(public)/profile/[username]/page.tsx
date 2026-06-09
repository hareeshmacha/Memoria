'use client';

import React, { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import { User, Calendar, Users, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [params.username]);

  const fetchProfile = async () => {
    try {
      const res = await endpoints.users.getProfile(params.username);
      setProfile(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Profile not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 page-transition">
        <h1 className="text-3xl font-bold text-zinc-100 mb-4 tracking-tight">{error || 'User Not Found'}</h1>
        <Link href="/explore" className="text-violet-400 hover:text-violet-300">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 page-transition">
      <div className="max-w-4xl mx-auto">
        <div className="base-card overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-violet-900/40 to-cyan-900/30 relative"></div>
          <div className="px-8 pb-8 relative">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-[#161616] shadow-xl absolute -top-12 flex items-center justify-center text-3xl font-bold text-zinc-100 overflow-hidden">
              {profile.avatar_s3_key ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://your-s3-bucket.s3.amazonaws.com/${profile.avatar_s3_key}`} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile.full_name.charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="pt-16">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">{profile.full_name}</h1>
              <p className="text-violet-400 font-medium">@{profile.username}</p>
              
              {profile.bio && (
                <p className="mt-4 text-zinc-300 max-w-2xl font-body">
                  {profile.bio}
                </p>
              )}
              
              <div className="mt-6 flex items-center text-sm text-zinc-500 font-medium uppercase tracking-wide text-xs">
                <Calendar className="w-4 h-4 mr-1.5" />
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 flex items-center tracking-tight text-zinc-100">
          <Users className="w-6 h-6 mr-2 text-violet-500" />
          Clubs
        </h2>

        {(!profile.memberships || profile.memberships.length === 0) ? (
          <div className="base-card p-8 text-center text-zinc-500 font-body">
            This user hasn't joined any clubs yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profile.memberships.map((membership: any) => (
              <Link 
                key={membership.club.id}
                href={`/clubs/${membership.club.slug}`}
                className="interactive-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 group-hover:text-violet-400 transition-colors tracking-tight">
                      {membership.club.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 capitalize font-medium">{membership.role}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
