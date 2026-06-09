import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_s3_key?: string | null;
  face_indexed?: boolean;
}

interface AuthState {
  currentUser: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setFaceIndexed: (indexed: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      setAuth: (user, token) => set({ currentUser: user, accessToken: token }),
      clearAuth: () => set({ currentUser: null, accessToken: null }),
      setFaceIndexed: (indexed) => set((state) => ({ 
        currentUser: state.currentUser ? { ...state.currentUser, face_indexed: indexed } : null 
      })),
    }),
    {
      name: 'memoria-auth',
    }
  )
);
