'use client';

import { useEffect, useState } from 'react';
import { FileImage, X, CheckCircle2, AlertCircle, Loader2, Play, UploadCloud } from 'lucide-react';
import { useUploadStore, UploadItem } from '@/store/uploadStore';
import { api } from '@/lib/api';
import axios from 'axios';

export function UploadProgress() {
  const { uploads, config, updateProgress, updateStatus, removeUpload, startUploads } = useUploadStore();

  useEffect(() => {
    // Process queued uploads
    const queuedUploads = uploads.filter(u => u.status === 'queued');
    
    if (!config && queuedUploads.length > 0) {
      queuedUploads.forEach(u => updateStatus(u.id, 'error', 'No club selected'));
      return;
    }

    queuedUploads.forEach(async (upload) => {
      updateStatus(upload.id, 'uploading');
      
      let step = 'getting presigned URL';
      try {
        // 1. Get Presigned URL from Backend
        const { data: urlResponse } = await api.post('/media/upload-url', {
          contentType: upload.file.type,
          folder: `events/${config?.eventId || 'test-event'}` 
        });
        
        const { uploadUrl, key } = urlResponse.data;

        step = 'uploading directly to S3';
        // 2. Upload file directly to S3
        await axios.put(uploadUrl, upload.file, {
          headers: {
            'Content-Type': upload.file.type
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              updateProgress(upload.id, percentCompleted);
            }
          }
        });

        step = 'saving record to database';
        // 3. Save media record in backend
        await api.post('/media', {
          clubId: config!.clubId,
          eventId: config!.eventId,
          originalName: upload.file.name,
          s3Key: key,
          sizeBytes: upload.file.size,
          contentType: upload.file.type,
          visibility: config!.visibility
        });

        updateStatus(upload.id, 'success');
      } catch (error: any) {
        console.error('Upload failed:', error);
        const errorMessage = error?.response?.data?.error || error?.message || String(error);
        updateStatus(upload.id, 'error', `Failed at [${step}]: ${errorMessage}`);
      }
    });
  }, [uploads, config, updateProgress, updateStatus]);

  if (uploads.length === 0) return null;

  const pendingUploads = uploads.filter(u => u.status === 'pending');
  const activeUploads = uploads.filter(u => u.status !== 'pending');

  return (
    <div className="mt-8 space-y-8">
      {/* Pending Previews */}
      {pendingUploads.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">Ready to Upload</h3>
              <p className="text-sm text-muted-foreground">{pendingUploads.length} file{pendingUploads.length !== 1 ? 's' : ''} selected</p>
            </div>
            <button
              onClick={startUploads}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center shadow-sm"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Start Upload
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pendingUploads.map(upload => (
              <PreviewCard key={upload.id} upload={upload} onRemove={() => removeUpload(upload.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Active/Completed Uploads */}
      {activeUploads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Upload Queue</h3>
          <div className="space-y-3">
            {activeUploads.map((upload) => (
              <UploadItemRow 
                key={upload.id} 
                upload={upload} 
                onRemove={() => removeUpload(upload.id)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewCard({ upload, onRemove }: { upload: UploadItem; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(upload.file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [upload.file]);

  const isVideo = upload.file.type.startsWith('video/');

  return (
    <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/30 aspect-square">
      {previewUrl ? (
        isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-black/50">
            <video src={previewUrl} className="w-full h-full object-cover opacity-70" />
            <Play className="absolute text-white w-8 h-8 opacity-80" />
          </div>
        ) : (
          <img src={previewUrl} alt={upload.file.name} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-destructive text-white rounded-full transition-colors backdrop-blur-sm shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-xs text-white truncate font-medium">{upload.file.name}</p>
          <p className="text-[10px] text-zinc-300">{(upload.file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      </div>
    </div>
  );
}

function UploadItemRow({ upload, onRemove }: { upload: UploadItem; onRemove: () => void }) {
  const { file, progress, status, error } = upload;

  return (
    <div className="flex items-center p-4 bg-card rounded-lg border border-border">
      <div className="p-2 bg-muted rounded-md mr-4">
        <FileImage className="w-6 h-6 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <span className="text-xs text-muted-foreground">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              status === 'error' ? 'bg-destructive' : status === 'success' ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Status Text */}
        <p className={`text-xs mt-1 ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {status === 'queued' && 'In Queue...'}
          {status === 'uploading' && `Uploading... ${progress}%`}
          {status === 'success' && 'Upload complete'}
          {status === 'error' && (error || 'Upload failed')}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        {status === 'uploading' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        {status === 'success' && <CheckCircle2 className="w-5 h-5 text-success" />}
        {status === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
        
        <button 
          onClick={onRemove}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
