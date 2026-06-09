import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const rawUrl = process.env.NEXT_PUBLIC_API_URL;
const baseURL = rawUrl 
  ? (rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl}/api/v1`)
  : 'https://memoria-2-4td4.onrender.com/api/v1';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().clearAuth();
      // Optional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const endpoints = {
  auth: {
    forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
    resetPassword: (data: { token: string, password: string }) => api.post('/auth/reset-password', data),
  },
  clubs: {
    getMyClubs: () => api.get('/clubs/my'),
    getBySlug: (slug: string) => api.get(`/clubs/slug/${slug}`),
    create: (data: { name: string; slug: string; description?: string }) => api.post('/clubs', data),
    update: (id: string, data: { name?: string; slug?: string; description?: string }) => api.put(`/clubs/${id}`, data),
    getMembers: (id: string) => api.get(`/clubs/${id}/members`),
    addMember: (id: string, data: { email: string; role: 'admin' | 'photographer' | 'member' }) => api.post(`/clubs/${id}/members`, data),
    removeMember: (id: string, userId: string) => api.delete(`/clubs/${id}/members/${userId}`),
    updateMemberRole: (id: string, userId: string, data: { role: 'admin' | 'photographer' | 'member' }) => api.put(`/clubs/${id}/members/${userId}`, data),
    join: (id: string) => api.post(`/clubs/${id}/join`),
    getRequests: (id: string) => api.get(`/clubs/${id}/requests`),
    approveRequest: (id: string, userId: string) => api.post(`/clubs/${id}/requests/${userId}/approve`),
    rejectRequest: (id: string, userId: string) => api.post(`/clubs/${id}/requests/${userId}/reject`),
    getEvents: (id: string, sort?: string) => api.get(`/clubs/${id}/events${sort ? `?sort=${sort}` : ''}`),
    getEventsBySlug: (slug: string, sort?: string) => api.get(`/clubs/slug/${slug}/events${sort ? `?sort=${sort}` : ''}`),
    createEvent: (id: string, data: any) => api.post(`/clubs/${id}/events`, data),
    getAllPublic: () => api.get('/clubs'),
  },
  events: {
    getAll: () => api.get('/events'),
    getAllPublic: () => api.get('/events/public'),
    create: (data: any) => api.post('/events', data),
    update: (id: string, data: any) => api.put(`/events/${id}`, data),
    delete: (id: string) => api.delete(`/events/${id}`),
  },
  media: {
    getUploadUrl: (data: { contentType: string; folder?: string }) => 
      api.post('/media/upload-url', data),
    saveRecord: (data: any) => 
      api.post('/media', data),
    getMyPhotos: () => 
      api.get('/media/my-photos'),
    search: (params: { q?: string, sort?: string, type?: string, startDate?: string, endDate?: string, page?: number, limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.append('q', params.q);
      if (params.sort) searchParams.append('sort', params.sort);
      if (params.type) searchParams.append('type', params.type);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      return api.get(`/media/search?${searchParams.toString()}`);
    },
    getFeed: (page: number = 1, limit: number = 20) => api.get(`/media/feed?page=${page}&limit=${limit}`),
    getFavourites: () => api.get('/media/favourites'),
    toggleFavourite: (id: string) => api.post(`/media/${id}/favourite`),
    toggleLike: (id: string) => api.post(`/media/${id}/like`),
    trackDownload: (id: string) => api.post(`/media/${id}/download`),
    getComments: (id: string) => api.get(`/media/${id}/comments`),
    addComment: (id: string, content: string) => api.post(`/media/${id}/comments`, { content }),
    deleteComment: (commentId: string) => api.delete(`/media/comments/${commentId}`),
    getEventMedia: (id: string, page: number = 1, limit: number = 20) => api.get(`/media/event/${id}?page=${page}&limit=${limit}`),
    addTag: (id: string, taggedUserId: string) => api.post(`/media/${id}/tags`, { taggedUserId }),
    removeTag: (tagId: string) => api.delete(`/media/tags/${tagId}`),
    delete: (id: string) => api.delete(`/media/${id}`),
  },
  notifications: {
    get: () => api.get('/notifications'),
    markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  },
  users: {
    registerFace: (s3Key: string) =>
      api.post('/users/register-face', { s3Key }),
    updateProfile: (data: any) =>
      api.put('/users/me', data),
    getProfile: (username: string) => 
      api.get(`/users/profile/${username}`),
    searchUsers: (query: string) =>
      api.get(`/users/search?q=${encodeURIComponent(query)}`),
    getDashboardStats: () => api.get('/users/me/dashboard-stats'),
  },
  analytics: {
    getClubAnalytics: (slug: string) => api.get(`/analytics/clubs/${slug}`),
    getUserAnalytics: () => api.get('/analytics/user'),
  }
};
