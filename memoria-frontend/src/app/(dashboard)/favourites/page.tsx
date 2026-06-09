'use client';

import React, { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import { Heart, Loader2 } from 'lucide-react';
import { Lightbox } from '@/components/Lightbox';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FavouritesPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const fetchFavourites = async () => {
    try {
      const res = await endpoints.media.getFavourites();
      setPhotos(res.data.data);
    } catch (err) {
      console.error('Failed to load favourites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Heart className="w-8 h-8 mr-3 text-pink-500 fill-current" />
          Favourites
        </h1>
        <p className="text-zinc-400">Photos you have saved from across the platform.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No favourites yet</h2>
          <p className="text-zinc-400 mb-6">Explore the feed or search for photos to save your favourites here.</p>
          <Link href="/explore">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Explore Photos</Button>
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((photo) => {
            const url = photo.signed_url || `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'hareesh-project-uploads'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1'}.amazonaws.com/${photo.s3_key}`;
            return (
              <div 
                key={photo.id} 
                className="break-inside-avoid relative group rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer"
                onClick={() => setSelectedMedia(photo)}
              >
                <img 
                  src={url} 
                  alt="Favourite" 
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white font-medium text-sm truncate">{photo.event?.title || 'Unknown Event'}</p>
                  <p className="text-zinc-300 text-xs truncate flex items-center mt-1">
                    <span className="w-4 h-4 rounded-full bg-zinc-700 mr-2 flex items-center justify-center text-[8px]">
                      {photo.uploader?.full_name?.charAt(0)}
                    </span>
                    {photo.uploader?.full_name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMedia && (
        <Lightbox 
          media={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
          onDeleteSuccess={() => { setSelectedMedia(null); fetchFavourites(); }} 
        />
      )}
    </div>
  );
}
