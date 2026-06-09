'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { useUploadStore } from '@/store/uploadStore';

export function MediaUploader() {
  const addUploads = useUploadStore(state => state.addUploads);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      addUploads(acceptedFiles);
    }
  }, [addUploads]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  return (
    <div
      {...getRootProps()}
      className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 cursor-pointer ${
        isDragActive
          ? 'border-primary bg-primary/10'
          : isDragReject
          ? 'border-destructive bg-destructive/10'
          : 'border-border bg-card hover:bg-muted/50 hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <p className="text-lg font-medium text-foreground">
            {isDragActive ? 'Drop your media here' : 'Drag & drop media here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse files
          </p>
        </div>
        <div className="text-xs text-muted-foreground/70">
          Supports JPG, PNG, WEBP, MP4, MOV up to 100MB
        </div>
      </div>
    </div>
  );
}
