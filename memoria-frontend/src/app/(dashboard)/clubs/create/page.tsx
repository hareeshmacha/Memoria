'use client';

import React, { useState } from 'react';
import { endpoints } from '@/lib/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updates = { ...prev, [name]: value };
      // Auto-generate slug from name if slug hasn't been manually touched much
      if (name === 'name' && prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) {
        updates.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return updates;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await endpoints.clubs.create(formData);
      if (res.data.data) {
        router.push(`/clubs/${res.data.data.slug}/manage`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create club. Slug might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <Link 
          href="/clubs" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Clubs
        </Link>
        <h1 className="text-3xl font-extrabold text-white">Create a New Club</h1>
        <p className="text-zinc-400 mt-2">Set up a new organization to host events and manage media.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Club Name</Label>
            <Input 
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Photography Society"
              className="bg-zinc-950 border-zinc-800 text-white"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-white">URL Slug</Label>
            <div className="flex items-center">
              <span className="bg-zinc-800 text-zinc-400 px-4 py-2 border border-zinc-700 border-r-0 rounded-l-md text-sm">
                antigravity.app/
              </span>
              <Input 
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="photography-society"
                className="bg-zinc-950 border-zinc-800 text-white rounded-l-none"
                required
                minLength={2}
              />
            </div>
            <p className="text-xs text-zinc-500">This must be unique across the platform.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description (Optional)</Label>
            <textarea 
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What is this club about?"
              className="flex min-h-[100px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Link href="/clubs">
              <Button type="button" variant="ghost" className="mr-4 text-zinc-400 hover:text-white">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading || !formData.name || !formData.slug}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Create Club
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
