'use client';

import React, { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import { ArrowLeft, Users, UserPlus, Loader2, Calendar, Shield, Camera, Check, X, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

export default function ClubManagementPage({ params }: { params: { slug: string } }) {
  const { currentUser } = useAuthStore();
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  
  // Add member state
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'admin'|'photographer'|'member'>('photographer');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  // Join state
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Create event state
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventData, setEventData] = useState({ title: '', slug: '', category: 'General', description: '', event_date: '' });
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState('');
  const [eventSort, setEventSort] = useState('date_desc');

  useEffect(() => {
    fetchData();
  }, [params.slug, eventSort]);

  // Club Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsData, setSettingsData] = useState({ name: '', slug: '', description: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const fetchData = async () => {
    try {
      const clubRes = await endpoints.clubs.getBySlug(params.slug);
      const clubData = clubRes.data.data;
      setClub(clubData);
      setSettingsData({ name: clubData.name, slug: clubData.slug, description: clubData.description || '' });

      const [membersRes, eventsRes] = await Promise.all([
        endpoints.clubs.getMembers(clubData.id),
        endpoints.clubs.getEvents(clubData.id, eventSort)
      ]);
      setMembers(membersRes.data.data);
      setEvents(eventsRes.data.data);

      // If we are admin, also fetch requests
      const role = membersRes.data.data.find((m: any) => m.user.id === currentUser?.id)?.role;
      if (role === 'admin') {
        const reqRes = await endpoints.clubs.getRequests(clubData.id);
        setRequests(reqRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!club) return;
    setJoinLoading(true);
    setJoinError('');
    try {
      await endpoints.clubs.join(club.id);
      await fetchData();
    } catch (err: any) {
      setJoinError(err.response?.data?.error || 'Failed to join club');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!club) return;
    try {
      await endpoints.clubs.approveRequest(club.id, userId);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (userId: string) => {
    if (!club) return;
    try {
      await endpoints.clubs.rejectRequest(club.id, userId);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    setAddLoading(true);
    setError('');
    try {
      await endpoints.clubs.addMember(club.id, { email: addEmail, role: addRole });
      setAddEmail('');
      await fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAddLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    setEventLoading(true);
    setEventError('');
    try {
      await endpoints.clubs.createEvent(club.id, eventData);
      setEventData({ title: '', slug: '', category: 'General', description: '', event_date: '' });
      setShowCreateEvent(false);
      await fetchData();
    } catch (err: any) {
      setEventError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setEventLoading(false);
    }
  };

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    setSettingsLoading(true);
    setSettingsError('');
    try {
      await endpoints.clubs.update(club.id, settingsData);
      if (settingsData.slug !== club.slug) {
        window.location.href = `/clubs/${settingsData.slug}/manage`;
      } else {
        await fetchData();
        setShowSettings(false);
      }
    } catch (err: any) {
      setSettingsError(err.response?.data?.error || 'Failed to update club');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventData(prev => {
      const updates = { ...prev, [name]: value };
      if (name === 'title' && prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) {
        updates.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return updates;
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-rose-400 mr-2" />;
      case 'photographer': return <Camera className="w-4 h-4 text-amber-400 mr-2" />;
      default: return <Users className="w-4 h-4 text-indigo-400 mr-2" />;
    }
  };

  const myMembership = members.find((m: any) => m.user.id === currentUser?.id);
  const myRole = myMembership?.status === 'active' ? myMembership.role : null;
  const isPending = myMembership?.status === 'pending';

  return (
    <div className="max-w-6xl mx-auto py-8 page-transition">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Link 
            href="/clubs" 
            className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Clubs
          </Link>
          <h1 className="text-3xl font-extrabold text-zinc-100 flex items-center tracking-tight">
            Club Hub
            {myRole && (
              <span className="ml-4 px-3 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm rounded-full capitalize font-medium">
                {myRole}
              </span>
            )}
          </h1>
        </div>
        
        {myRole === 'admin' && (
          <div className="flex flex-col items-end">
            <Link href={`/clubs/${club?.slug}/analytics`} className="secondary-btn text-sm py-2">
              <TrendingUp className="w-4 h-4 mr-2 text-cyan-400" />
              Analytics
            </Link>
          </div>
        )}
        
        {!myRole && !isPending && !loading && (
          <div className="flex flex-col items-end">
            <Button onClick={handleJoin} disabled={joinLoading} className="primary-btn">
              {joinLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Join Club
            </Button>
            {joinError && <span className="text-xs text-rose-500 mt-2">{joinError}</span>}
          </div>
        )}
        {isPending && !loading && (
          <Button variant="secondary" disabled className="bg-[#1e1e1e] text-zinc-400 border border-[#2A2A2A]">
            Request Pending
          </Button>
        )}
      </div>

      <div className="flex border-b border-[#2A2A2A] mb-8">
        <button 
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'members' ? 'border-violet-500 text-zinc-100' : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:border-[#3A3A3A]'}`}
          onClick={() => setActiveTab('members')}
        >
          Members & Roles
        </button>
        <button 
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'events' ? 'border-violet-500 text-zinc-100' : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:border-[#3A3A3A]'}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        {myRole === 'admin' && (
          <button 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center ${activeTab === 'requests' ? 'border-violet-500 text-zinc-100' : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:border-[#3A3A3A]'}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests
            {requests.length > 0 && (
              <span className="ml-2 bg-rose-500 text-zinc-100 text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
            )}
          </button>
        )}
        {myRole === 'admin' && (
          <button 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'settings' ? 'border-violet-500 text-zinc-100' : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:border-[#3A3A3A]'}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'members' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className={`space-y-4 ${myRole === 'admin' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <div className="base-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#2A2A2A]">
                    <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Current Members</h2>
                  </div>
                  <div className="divide-y divide-[#2A2A2A]">
                    {members.filter((m:any) => m.status === 'active').map((m: any) => (
                      <div key={m.id} className="p-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold mr-4">
                            {m.user?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-white font-medium">{m.user?.full_name}</p>
                            <p className="text-zinc-500 text-sm">{m.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {myRole === 'admin' && m.user.id !== currentUser?.id ? (
                            <>
                              <select
                                value={m.role}
                                onChange={async (e) => {
                                  try {
                                    await endpoints.clubs.updateMemberRole(club.id, m.user.id, { role: e.target.value as any });
                                    fetchData();
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-300"
                              >
                                <option value="photographer">Photographer</option>
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                              </select>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0"
                                onClick={async () => {
                                  if (confirm('Remove this member?')) {
                                    try {
                                      await endpoints.clubs.removeMember(club.id, m.user.id);
                                      fetchData();
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full">
                              {getRoleIcon(m.role)}
                              <span className="text-sm font-medium text-zinc-300 capitalize">{m.role}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {myRole === 'admin' && (
                <div>
                  <div className="base-card p-6 sticky top-6">
                    <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center tracking-tight">
                      <UserPlus className="w-5 h-5 mr-2 text-violet-500" />
                      Add Member
                    </h2>
                    
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-4">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleAddMember} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">User Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={addEmail} 
                          onChange={e => setAddEmail(e.target.value)}
                          placeholder="Enter user email..."
                          className="bg-zinc-950 border-zinc-800"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-zinc-300">Assign Role</Label>
                        <select
                          id="role"
                          value={addRole}
                          onChange={(e: any) => setAddRole(e.target.value)}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
                        >
                          <option value="photographer">Photographer (Can upload media)</option>
                          <option value="admin">Admin (Can manage club)</option>
                          <option value="member">Member (Can view club media)</option>
                        </select>
                      </div>

                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={addLoading || !addEmail}>
                        {addLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Add Member'}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && myRole === 'admin' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-white">Pending Requests</h2>
              </div>
              {requests.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">No pending requests to join the club.</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {requests.map((r: any) => (
                    <div key={r.id} className="p-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold mr-4">
                          {r.user?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{r.user?.full_name}</p>
                          <p className="text-zinc-500 text-sm">{r.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={() => handleApprove(r.user.id)} className="bg-emerald-600 hover:bg-emerald-700">
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(r.user.id)}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="base-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2A2A2A] flex justify-between items-center">
                <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Club Events</h2>
                <div className="flex gap-4">
                  <select
                    value={eventSort}
                    onChange={(e) => setEventSort(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1 focus:outline-none"
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="category">Category</option>
                  </select>
                  {(myRole === 'admin' || myRole === 'photographer') && !showCreateEvent && (
                    <Button 
                      onClick={() => setShowCreateEvent(true)}
                      variant="outline" 
                      className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 text-sm h-8 px-3 transition-colors"
                    >
                      Create Event
                    </Button>
                  )}
                </div>
              </div>
              
              {showCreateEvent ? (
                <div className="p-6">
                  <h3 className="text-xl font-medium text-white mb-6">Create New Event</h3>
                  
                  {eventError && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-3 rounded-lg text-sm mb-4">
                      {eventError}
                    </div>
                  )}

                  <form onSubmit={handleCreateEvent} className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Event Title</Label>
                        <Input 
                          name="title"
                          value={eventData.title}
                          onChange={handleEventChange}
                          placeholder="Summer Party"
                          className="bg-zinc-950 border-zinc-800"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Event Date</Label>
                        <Input 
                          type="date"
                          name="event_date"
                          value={eventData.event_date}
                          onChange={handleEventChange}
                          className="bg-zinc-950 border-zinc-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">URL Slug</Label>
                        <Input 
                          name="slug"
                          value={eventData.slug}
                          onChange={handleEventChange}
                          placeholder="summer-party"
                          className="bg-zinc-950 border-zinc-800"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Category</Label>
                        <select
                          name="category"
                          value={eventData.category}
                          onChange={handleEventChange}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
                        >
                          <option value="General">General</option>
                          <option value="Party">Party</option>
                          <option value="Trip">Trip</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Marriage">Marriage</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button type="button" variant="ghost" onClick={() => setShowCreateEvent(false)} className="mr-4 text-zinc-400 hover:text-white">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={eventLoading || !eventData.title || !eventData.event_date} className="bg-indigo-600 hover:bg-indigo-700">
                        {eventLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create
                      </Button>
                    </div>
                  </form>
                </div>
              ) : events.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No events yet</h3>
                  <p className="text-zinc-500">Create an event to start uploading photos to this club.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {events.map((e: any) => (
                    <div key={e.id} className="p-6 hover:bg-zinc-800/50 transition-colors flex justify-between items-center group cursor-pointer" onClick={() => window.location.href = `/clubs/${club?.slug}/events/${e.slug}`}>
                      <div>
                        <h3 className="text-white font-medium text-lg group-hover:text-indigo-400 transition-colors">{e.title}</h3>
                        <div className="flex items-center text-sm text-zinc-500 mt-1">
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          {new Date(e.event_date).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          <span className="capitalize">{e.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={(evt) => { evt.stopPropagation(); window.location.href = `/clubs/${club?.slug}/events/${e.slug}`; }}>
                          View Gallery
                        </Button>
                        {(myRole === 'admin' || myRole === 'photographer') && (
                          <Link href={`/clubs/${club?.slug}/events/${e.slug}/upload`} onClick={(evt) => evt.stopPropagation()}>
                            <Button variant="secondary" className="bg-indigo-600 text-white hover:bg-indigo-700">
                              Upload Photos
                            </Button>
                          </Link>
                        )}
                        {myRole === 'admin' && (
                          <Button 
                            variant="ghost" 
                            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" 
                            onClick={async (evt) => { 
                              evt.stopPropagation(); 
                              if (confirm('Delete this event?')) {
                                try {
                                  await endpoints.events.delete(e.id);
                                  fetchData();
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && myRole === 'admin' && (
            <div className="base-card p-6">
              <h2 className="text-lg font-semibold text-zinc-100 mb-6 tracking-tight">Club Settings</h2>
              
              {settingsError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-4">
                  {settingsError}
                </div>
              )}

              <form onSubmit={handleUpdateClub} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Club Name</Label>
                  <Input 
                    value={settingsData.name} 
                    onChange={e => setSettingsData({...settingsData, name: e.target.value})}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">URL Slug</Label>
                  <Input 
                    value={settingsData.slug} 
                    onChange={e => setSettingsData({...settingsData, slug: e.target.value})}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Description</Label>
                  <textarea
                    value={settingsData.description}
                    onChange={e => setSettingsData({...settingsData, description: e.target.value})}
                    className="flex min-h-[100px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>

                <Button type="submit" disabled={settingsLoading} className="bg-indigo-600 hover:bg-indigo-700">
                  {settingsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Changes'}
                </Button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
