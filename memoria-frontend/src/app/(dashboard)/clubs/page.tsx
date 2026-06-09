'use client';

import React, { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import { Plus, Users, Shield, Camera } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ClubsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await endpoints.clubs.getMyClubs();
      setMemberships(res.data.data);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-rose-400" />;
      case 'photographer': return <Camera className="w-4 h-4 text-amber-400" />;
      default: return <Users className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 page-transition">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 mb-2 flex items-center tracking-tight">
            <Users className="w-8 h-8 mr-3 text-violet-500" />
            My Clubs
          </h1>
          <p className="text-zinc-400 font-body">Manage clubs you belong to or create a new one.</p>
        </div>
        <Link href="/clubs/create" className="primary-btn flex items-center text-sm py-2.5">
          <Plus className="w-4 h-4 mr-2" />
          Create Club
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : memberships.length === 0 ? (
        <div className="base-card p-12 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-100 tracking-tight">No Clubs Found</h3>
          <p className="text-zinc-400 mt-2 mb-6 font-body">You aren't a member of any clubs yet.</p>
          <Link href="/clubs/create" className="secondary-btn text-sm py-2.5">
            Create your first Club
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((membership) => (
            <Link key={membership.club.id} href={`/clubs/${membership.club.slug}/manage`} className="interactive-card block group">
              <div className="h-24 bg-gradient-to-br from-violet-900/40 to-[#080808] relative">
                {/* Banner placeholder */}
              </div>
              <div className="px-6 pb-6 relative">
                <div className="w-16 h-16 rounded-xl bg-zinc-900 border-4 border-[#161616] shadow-xl absolute -top-8 flex items-center justify-center text-2xl font-bold text-zinc-100">
                  {membership.club.name.charAt(0)}
                </div>
                <div className="pt-10 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100 group-hover:text-violet-400 transition-colors tracking-tight">
                      {membership.club.name}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1 font-body">/{membership.club.slug}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1e1e1e] text-zinc-300 capitalize border border-[#2A2A2A]">
                    <span className="mr-1.5">{getRoleIcon(membership.role)}</span>
                    {membership.role}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
