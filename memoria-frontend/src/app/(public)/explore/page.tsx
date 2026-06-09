'use client';

import React, { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import { Search, Compass, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Lightbox } from '@/components/Lightbox';
import { useRouter } from 'next/navigation';

export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'events' | 'clubs'>('photos');

  const [sort, setSort] = useState('date_desc');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (activeTab === 'photos') {
      if (debouncedQuery.trim().length > 0) {
        searchPhotos(debouncedQuery, sort, type, startDate, endDate);
      } else {
        setPhotos([]);
      }
    } else if (activeTab === 'events' && events.length === 0) {
      fetchEvents();
    } else if (activeTab === 'clubs' && clubs.length === 0) {
      fetchClubs();
    }
  }, [debouncedQuery, activeTab, sort, type, startDate, endDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await endpoints.events.getAll();
      setEvents(res.data.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const res = await endpoints.clubs.getAllPublic();
      setClubs(res.data.data);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPhotos = async (searchQuery: string, sortParam: string, typeParam: string, startParam?: string, endParam?: string) => {
    setLoading(true);
    try {
      const res = await endpoints.media.search({ q: searchQuery, sort: sortParam, type: typeParam, startDate: startParam, endDate: endParam });
      setPhotos(res.data.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto page-transition">
      <button 
        onClick={() => router.back()} 
        className="mb-6 flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2 flex items-center tracking-tight">
          <Compass className="w-8 h-8 mr-3 text-violet-500" />
          Explore
        </h1>
        <p className="text-zinc-400 font-body">Discover photos, upcoming events, and clubs.</p>
      </div>

      <div className="flex space-x-1 bg-[#1e1e1e] p-1 rounded-xl mb-8 max-w-md">
        {(['photos', 'events', 'clubs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all capitalize ${
              activeTab === tab
                ? 'bg-[#2A2A2A] text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#2A2A2A]/50'
            }`}
          >
            {tab === 'photos' ? 'Media' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'photos' && (
        <div className="mb-10 space-y-4 max-w-3xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <Input
              type="text"
              className="!pl-12 py-6 ui-input rounded-2xl shadow-xl"
              placeholder="Search by event, username, or tag (e.g. 'Concert', 'Mountain')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-[#1e1e1e] border border-[#2A2A2A] text-zinc-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="popular">Most Popular</option>
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-[#1e1e1e] border border-[#2A2A2A] text-zinc-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">All Media</option>
              <option value="image">Images Only</option>
              <option value="video">Videos Only</option>
            </select>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-zinc-500">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#1e1e1e] border border-[#2A2A2A] text-zinc-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-text"
              />
              <span className="text-sm text-zinc-500">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#1e1e1e] border border-[#2A2A2A] text-zinc-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-text"
              />
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && activeTab === 'photos' && debouncedQuery.trim().length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-600">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p>Start typing to search for photos</p>
        </div>
      )}

      {!loading && activeTab === 'photos' && debouncedQuery.trim().length > 0 && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-600">
          No photos found matching "{query}".
        </div>
      )}

      {!loading && activeTab === 'photos' && photos.length > 0 && (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2">
          {photos.map((photo) => {
            const url = photo.signed_url || `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'hareesh-project-uploads'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1'}.amazonaws.com/${photo.s3_key}`;
            return (
              <div 
                key={photo.id} 
                className="relative group break-inside-avoid mb-2 overflow-hidden rounded-lg ring-0 hover:ring-1 ring-violet-500/30 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedMedia(photo)}
              >
                {photo.file_type === 'video' ? (
                  <div className="relative w-full aspect-video bg-zinc-900 flex items-center justify-center">
                     <video src={url} className="w-full h-full object-cover opacity-70" muted />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/20">
                         <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                       </div>
                     </div>
                  </div>
                ) : (
                  <img 
                    src={url} 
                    alt="Search result" 
                    className="w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] group-hover:brightness-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex flex-wrap gap-2">
                      {photo.ai_tags?.map((tag: string) => (
                        <span 
                          key={tag} 
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            tag.toLowerCase() === debouncedQuery.toLowerCase() 
                              ? 'bg-violet-500/15 text-violet-400 border-violet-500/20' 
                              : 'bg-zinc-700/50 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && activeTab === 'events' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-zinc-600">
              No events found.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/clubs/${event.club?.slug}/events/${event.slug}`)}
                className="base-card rounded-xl overflow-hidden cursor-pointer group hover:ring-1 hover:ring-violet-500/30 transition-all duration-200"
              >
                <div className="h-48 bg-[#1e1e1e] relative overflow-hidden flex items-center justify-center">
                  <Compass className="w-12 h-12 text-zinc-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-2.5 py-1 bg-violet-500/20 text-violet-400 text-xs font-semibold rounded-full border border-violet-500/20 mb-2 inline-block">
                      {event.category}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                      {event.title}
                    </h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center text-sm text-zinc-400 mb-2">
                    <span className="w-6 h-6 rounded bg-[#2A2A2A] mr-2 flex items-center justify-center text-[10px] border border-[#3A3A3A] truncate">
                      {event.club?.name?.charAt(0)}
                    </span>
                    <span className="truncate">{event.club?.name}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">
                    {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'clubs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-zinc-600">
              No clubs found.
            </div>
          ) : (
            clubs.map((club) => (
              <div
                key={club.id}
                onClick={() => router.push(`/clubs/${club.slug}`)}
                className="base-card rounded-xl overflow-hidden cursor-pointer group hover:ring-1 hover:ring-rose-500/30 transition-all duration-200 p-6 flex items-center space-x-4"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border border-[#3A3A3A] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span className="text-2xl font-bold text-zinc-300">{club.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-zinc-100 group-hover:text-rose-300 transition-colors truncate">
                    {club.name}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                    {club.description || 'A community on Memoria'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedMedia && (
        <Lightbox 
          media={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
          onDeleteSuccess={() => { setSelectedMedia(null); searchPhotos(debouncedQuery, sort, type); }} 
        />
      )}
    </div>
  );
}
