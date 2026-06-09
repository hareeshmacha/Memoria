'use client';

import { useEffect, useState } from 'react';
import { MediaUploader } from '@/components/media/MediaUploader';
import { UploadProgress } from '@/components/media/UploadProgress';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { endpoints } from '@/lib/api';
import { useUploadStore } from '@/store/uploadStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function UploadPage({ params }: { params: { slug: string, eventSlug: string } }) {
  const { setConfig } = useUploadStore();
  const [club, setClub] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContext();
  }, [params.slug, params.eventSlug]);

  const fetchContext = async () => {
    try {
      const clubRes = await endpoints.clubs.getBySlug(params.slug);
      const clubData = clubRes.data.data;
      setClub(clubData);

      const eventsRes = await endpoints.clubs.getEventsBySlug(params.slug);
      const eventData = eventsRes.data.data.find((e: any) => e.slug === params.eventSlug);
      
      if (!eventData) {
        setError('Event not found.');
      } else {
        setEvent(eventData);
        setConfig({ clubId: clubData.id, eventId: eventData.id, visibility });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load club or event.');
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vis = e.target.value;
    setVisibility(vis);
    if (club && event) {
      setConfig({ clubId: club.id, eventId: event.id, visibility: vis });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center text-rose-500 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 page-transition">
      <div className="mb-8">
        <Link 
          href={`/clubs/${club?.slug}/manage`} 
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {club?.name} Management
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
          Upload Photos
        </h1>
        <p className="mt-2 text-zinc-400 font-body">
          Drag and drop your photos for {event?.title}.
        </p>
      </div>

      <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4 mb-8 flex justify-between items-center">
        <div className="flex flex-col md:flex-row md:items-center text-violet-300 text-sm">
          <span className="flex items-center mb-2 md:mb-0">
            <CheckCircle2 className="w-5 h-5 mr-2 text-violet-400" />
            Ready to upload to <strong className="ml-1 text-violet-200">{club?.name}</strong> 
            <span className="mx-2 text-violet-500">/</span> 
            <strong className="text-violet-200">{event?.title}</strong>
          </span>
          <div className="md:ml-auto flex items-center mt-2 md:mt-0">
            <Label className="text-violet-400 mr-2 text-xs font-semibold uppercase tracking-wide">Visibility:</Label>
            <select
              className="h-8 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 text-xs text-violet-200 font-medium focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              value={visibility}
              onChange={handleVisibilityChange}
            >
              <option value="public">Public</option>
              <option value="club">Club Only</option>
            </select>
          </div>
        </div>
      </div>
      
      <MediaUploader />
      <UploadProgress />
    </div>
  );
}
