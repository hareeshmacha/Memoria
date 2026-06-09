'use client';

import React, { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import { ArrowLeft, Download, Heart, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Lightbox } from '@/components/Lightbox';

export default function PublicEventGalleryPage({ params }: { params: { slug: string, eventSlug: string } }) {
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [params.slug, params.eventSlug]);

  const fetchData = async () => {
    try {
      // First get the club to get the event by slug
      const clubRes = await endpoints.clubs.getBySlug(params.slug);
      const eventsRes = await endpoints.clubs.getEventsBySlug(params.slug);
      
      const currentEvent = eventsRes.data.data.find((e: any) => e.slug === params.eventSlug);
      
      if (currentEvent) {
        setEvent(currentEvent);
        // Assuming we have an endpoint to get media for an event
        const mediaRes = await endpoints.media.getEventMedia(currentEvent.id);
        setPhotos(mediaRes.data.data);
      }
    } catch (err) {
      console.error(err);
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

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 page-transition">
        <h1 className="text-3xl font-bold text-zinc-100 mb-4 tracking-tight">Event Not Found</h1>
        <Link href={`/clubs/${params.slug}`} className="text-violet-400 hover:text-violet-300">
          Back to Club
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 page-transition">
      <div className="max-w-7xl mx-auto">
        <Link 
          href={`/clubs/${params.slug}`} 
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {params.slug}
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-zinc-100">{event.title}</h1>
            <div className="flex items-center text-zinc-400 font-medium text-sm tracking-wide uppercase">
              <span>{new Date(event.event_date).toLocaleDateString()}</span>
              <span className="mx-3">•</span>
              <span>{event.category}</span>
              <span className="mx-3">•</span>
              <span className="text-violet-400">{photos.length} Photos</span>
            </div>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="base-card p-12 text-center">
            <p className="text-zinc-500 text-lg font-body">No photos have been uploaded to this event yet.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {photos.map((photo) => {
              const url = photo.signed_url || `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'hareesh-project-uploads'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1'}.amazonaws.com/${photo.s3_key}`;
              return (
              <div 
                key={photo.id} 
                className="group relative break-inside-avoid mb-4 bg-zinc-900 rounded-xl overflow-hidden ring-0 hover:ring-1 ring-violet-500/30 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedMedia(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={url} 
                  alt="Event photo"
                  className="w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] group-hover:brightness-110"
                />
              </div>
            )})}
          </div>
        )}
      </div>

      {selectedMedia && (
        <Lightbox 
          media={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
        />
      )}
    </div>
  );
}
