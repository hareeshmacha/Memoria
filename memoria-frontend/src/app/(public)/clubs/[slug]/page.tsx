'use client';

import React, { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import { Calendar, Users, MapPin, Globe, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export default function PublicClubPage({ params }: { params: { slug: string } }) {
  const [club, setClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('date_desc');
  
  const { currentUser } = useAuthStore();
  const [membershipState, setMembershipState] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    fetchClubData();
  }, [params.slug, sort]);

  const fetchClubData = async () => {
    try {
      const [clubRes, eventsRes] = await Promise.all([
        endpoints.clubs.getBySlug(params.slug),
        endpoints.clubs.getEventsBySlug(params.slug, sort)
      ]);
      setClub(clubRes.data.data);
      setEvents(eventsRes.data.data);

      if (currentUser) {
        try {
          const myClubs = await endpoints.clubs.getMyClubs();
          const membership = myClubs.data.data.find((m: any) => m.club_id === clubRes.data.data.id);
          setMembershipState(membership ? membership.status : 'none');
        } catch (e) {
          console.error('Failed to fetch memberships');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!club) return;
    setJoinLoading(true);
    try {
      await endpoints.clubs.join(club.id);
      setMembershipState('pending');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join club');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 page-transition">
        <h1 className="text-3xl font-bold text-zinc-100 mb-4 tracking-tight">Club Not Found</h1>
        <Link href="/explore" className="text-violet-400 hover:text-violet-300">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 page-transition">
      <div className="max-w-6xl mx-auto">
        <Link 
          href="/explore" 
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Explore
        </Link>
        
        <div className="base-card p-8 mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-zinc-100">{club.name}</h1>
            <p className="text-xl text-zinc-400 max-w-3xl font-body">
              {club.description || 'Welcome to our photography club!'}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end">
            {!currentUser ? (
              <Link href="/login">
                <Button className="primary-btn px-8">Sign in to Join</Button>
              </Link>
            ) : membershipState === 'none' ? (
              <Button onClick={handleJoin} disabled={joinLoading} className="primary-btn px-8">
                {joinLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Join Club
              </Button>
            ) : membershipState === 'pending' ? (
              <Button variant="secondary" disabled className="bg-[#1e1e1e] text-zinc-400 border border-[#2A2A2A]">
                Request Pending
              </Button>
            ) : membershipState === 'active' ? (
              <Link href={`/clubs/${club.slug}/manage`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Go to Dashboard
                </Button>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center tracking-tight text-zinc-100">
            <Calendar className="w-6 h-6 mr-2 text-violet-500" />
            Public Galleries
          </h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#1e1e1e] border border-[#2A2A2A] text-zinc-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="date_desc">Newest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="category">Category</option>
          </select>
        </div>

        {events.length === 0 ? (
          <div className="base-card p-12 text-center">
            <p className="text-zinc-500 text-lg font-body">No public galleries available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link 
                key={event.id}
                href={`/clubs/${club.slug}/events/${event.slug}`}
                className="interactive-card block overflow-hidden"
              >
                <div className="aspect-video bg-zinc-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-zinc-700 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-violet-400 transition-colors tracking-tight">{event.title}</h3>
                  <div className="flex items-center text-sm text-zinc-500 font-medium tracking-wide uppercase text-xs">
                    {new Date(event.event_date).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    <span>{event.category}</span>
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
