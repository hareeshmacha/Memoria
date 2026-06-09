'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { endpoints } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Camera, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Lightbox } from '@/components/Lightbox';

export default function MyPhotosPage() {
  const { currentUser, setFaceIndexed } = useAuthStore();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // Face Registration State
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [selfieError, setSelfieError] = useState('');
  const [selfieSuccess, setSelfieSuccess] = useState(false);

  useEffect(() => {
    if (currentUser?.face_indexed) {
      loadPhotos();
    } else {
      setLoading(false);
    }
  }, [currentUser?.face_indexed]);

  const loadPhotos = async () => {
    try {
      const res = await endpoints.media.getMyPhotos();
      setPhotos(res.data.data);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    setUploadingSelfie(true);
    setSelfieError('');

    try {
      // 1. Get presigned URL
      const { data } = await endpoints.media.getUploadUrl({
        contentType: file.type,
        folder: 'selfies'
      });

      // 2. Upload directly to S3
      await axios.put(data.data.uploadUrl, file, {
        headers: { 'Content-Type': file.type }
      });

      // 3. Register face with backend
      await endpoints.users.registerFace(data.data.key);

      setSelfieSuccess(true);
      setFaceIndexed(true);
    } catch (error: any) {
      console.error('Upload Error:', error);
      setSelfieError(error.response?.data?.error || 'Failed to upload and register selfie.');
    } finally {
      setUploadingSelfie(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
  });

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Loading your photos...</div>;
  }

  // If user hasn't registered their face
  if (!currentUser?.face_indexed && !selfieSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-8 pt-24 text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Find Yourself with AI</h1>
          <p className="text-zinc-400 mb-8 text-lg">
            Upload a clear selfie to register your face. Memoria will automatically scan all event photos and find the ones you appear in!
          </p>

          {selfieError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-3" />
              {selfieError}
            </div>
          )}

          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-600'}
            `}
          >
            <input {...getInputProps()} />
            
            {uploadingSelfie ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-zinc-300 font-medium">Analyzing your beautiful face...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-zinc-500 mb-4" />
                <p className="text-white font-medium text-lg mb-2">Drag & drop a selfie here</p>
                <p className="text-zinc-500">or click to browse files</p>
              </div>
            )}
          </div>
          
          <p className="mt-6 text-sm text-zinc-600">
            Your selfie is securely stored and only used to find your photos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Photos</h1>
        <p className="text-zinc-400">AI automatically found you in these event photos.</p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">You're registered!</h2>
          <p className="text-zinc-400">
            We haven't found you in any photos yet. When photographers upload event photos, they will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => {
            const url = photo.signed_url || `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'hareesh-project-uploads'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1'}.amazonaws.com/${photo.s3_key}`;
            return (
              <div 
                key={photo.id} 
                className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-zinc-800 cursor-pointer"
                onClick={() => setSelectedMedia(photo)}
              >
                <img 
                  src={url} 
                  alt="Detected face" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                  <div className="flex flex-wrap gap-2">
                    {photo.ai_tags?.slice(0,3).map((tag: string) => (
                      <span key={tag} className="text-xs font-medium bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-full border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
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
          onDeleteSuccess={() => { setSelectedMedia(null); loadPhotos(); }} 
        />
      )}
    </div>
  );
}
