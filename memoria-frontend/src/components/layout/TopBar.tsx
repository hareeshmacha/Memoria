'use client';

import { Menu, Search, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function TopBar() {
  const { currentUser } = useAuthStore();

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 glass-nav border-b border-[#2A2A2A] lg:hidden">
      <button
        type="button"
        className="px-4 border-r border-[#2A2A2A] text-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-lg lg:max-w-xs">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-[#2A2A2A] rounded-md leading-5 bg-[#161616] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:bg-[#1E1E1E] focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm transition-all font-body"
                placeholder="Search events, clubs, people..."
                type="search"
              />
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center lg:ml-6 space-x-4">
          <button
            type="button"
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080808] focus:ring-violet-500 transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Profile dropdown stub */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold">
              {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
