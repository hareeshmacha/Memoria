import { create } from 'zustand';

export type UploadStatus = 'pending' | 'queued' | 'uploading' | 'success' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface UploadState {
  uploads: UploadItem[];
  config: {
    clubId: string;
    eventId: string;
    visibility: string;
  } | null;
  setConfig: (config: { clubId: string; eventId: string; visibility: string } | null) => void;
  addUploads: (files: File[]) => void;
  startUploads: () => void;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: UploadStatus, error?: string) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: [],
  config: null,
  setConfig: (config) => set({ config }),
  addUploads: (files) => set((state) => {
    const newUploads = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending' as UploadStatus
    }));
    return { uploads: [...state.uploads, ...newUploads] };
  }),
  startUploads: () => set((state) => ({
    uploads: state.uploads.map(u => u.status === 'pending' ? { ...u, status: 'queued' } : u)
  })),
  updateProgress: (id, progress) => set((state) => ({
    uploads: state.uploads.map(u => u.id === id ? { ...u, progress } : u)
  })),
  updateStatus: (id, status, error) => set((state) => ({
    uploads: state.uploads.map(u => u.id === id ? { ...u, status, error } : u)
  })),
  removeUpload: (id) => set((state) => ({
    uploads: state.uploads.filter(u => u.id !== id)
  })),
  clearCompleted: () => set((state) => ({
    uploads: state.uploads.filter(u => u.status !== 'success')
  }))
}));
