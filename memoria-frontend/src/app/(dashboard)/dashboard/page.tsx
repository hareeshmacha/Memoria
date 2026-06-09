'use client';

import { useAuthStore } from '@/store/authStore';
import { Camera, Calendar, Users, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import { Lightbox } from '@/components/Lightbox';

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const fetchFeed = async () => {
    try {
      const res = await endpoints.media.getFeed();
      setFeed(res.data.data);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="space-y-8 page-transition">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Welcome back, {currentUser?.full_name?.split(' ')[0] || 'Photographer'}
        </h1>
        <p className="mt-2 text-zinc-400 font-body">
          Here is what's happening with your clubs and events today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Link href="/my-photos" className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/20 bg-zinc-900 border border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4 text-violet-400 group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-1">My Gallery</h3>
              <p className="text-sm text-zinc-400 font-medium">Browse your uploaded memories</p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-violet-400 transition-colors transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link href="/explore" className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20 bg-zinc-900 border border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-1">Explore Events</h3>
              <p className="text-sm text-zinc-400 font-medium">Discover upcoming club events</p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-cyan-400 transition-colors transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link href="/clubs" className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-rose-500/20 bg-zinc-900 border border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-4 text-rose-400 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-1">My Clubs</h3>
              <p className="text-sm text-zinc-400 font-medium">Manage your memberships</p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-rose-400 transition-colors transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Recent Activity Feed */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-zinc-100 mb-4 tracking-tight">Recent Activity</h2>
        
        {loading ? (
          <div className="flex justify-center py-20 base-card rounded-xl">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : feed.length === 0 ? (
          <div className="base-card rounded-xl border-dashed p-12 text-center">
            <Camera className="mx-auto h-12 w-12 text-zinc-600 opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-zinc-100">No recent activity</h3>
            <p className="mt-1 text-zinc-400 font-body">Get started by joining a club or attending an event.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {feed.map((media) => {
              const url = media.signed_url || `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'hareesh-project-uploads'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1'}.amazonaws.com/${media.s3_key}`;
              return (
                <div 
                  key={media.id} 
                  className="relative group break-inside-avoid mb-2 overflow-hidden rounded-lg ring-0 hover:ring-1 ring-violet-500/30 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedMedia(media)}
                >
                  {media.file_type === 'video' ? (
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
                      alt={media.original_filename} 
                      className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-[1.02] group-hover:brightness-110"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-zinc-100 font-semibold text-sm truncate">{media.event?.title || 'Unknown Event'}</p>
                    <p className="text-zinc-300 text-xs truncate flex items-center mt-1 font-medium">
                      <span className="w-4 h-4 rounded-full bg-[#2A2A2A] mr-2 flex items-center justify-center text-[8px] border border-[#3A3A3A]">
                        {media.uploader?.full_name?.charAt(0)}
                      </span>
                      {media.uploader?.full_name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedMedia && (
        <Lightbox 
          media={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
          onDeleteSuccess={() => { setSelectedMedia(null); fetchFeed(); }} 
        />
      )}
    </div>
  );
}
