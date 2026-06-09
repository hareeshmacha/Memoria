'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Image as ImageIcon, Heart, Bell, LogOut, Settings, UploadCloud, Compass, UserCircle, Upload, ShieldAlert, Users, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'My Clubs', href: '/clubs', icon: Users },
  { name: 'My Photos', href: '/my-photos', icon: UserCircle },
  { name: 'Favourites', href: '/favourites', icon: Heart },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'My Analytics', href: '/my-analytics', icon: TrendingUp },
];

import { useSocket } from '@/components/providers/SocketProvider';

export function Sidebar() {
  const pathname = usePathname();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const user = useAuthStore(state => state.user);
  const { unreadCount } = useSocket();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#080808] border-r border-[#2A2A2A] z-20">
      <div className="flex-1 flex flex-col min-h-0 pt-8 pb-4">
        <div className="flex items-center flex-shrink-0 px-6 mb-8">
          <Link href="/dashboard" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500 tracking-tight">
            Memoria
          </Link>
        </div>
        
        <nav className="mt-5 flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            let isActive = pathname === item.href;
            
            if (item.name === 'My Clubs') {
              isActive = pathname === '/clubs' || 
                         pathname === '/clubs/create' || 
                         pathname.endsWith('/manage') || 
                         pathname.endsWith('/analytics') ||
                         pathname.endsWith('/upload');
            } else if (item.href !== '/dashboard' && item.name !== 'Dashboard') {
              isActive = isActive || pathname.startsWith(`${item.href}/`);
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]' 
                    : 'text-zinc-400 hover:bg-[#161616] hover:text-zinc-100 hover:border-[#3A3A3A] border border-transparent'
                }`}
              >
                <item.icon
                  className={`mr-4 flex-shrink-0 h-5 w-5 transition-colors ${
                    isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-violet-400'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          
          {user?.is_admin && (
            <Link
              href="/admin"
              className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                pathname.startsWith('/admin')
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                  : 'text-zinc-400 hover:bg-[#161616] hover:text-zinc-100 hover:border-[#3A3A3A] border border-transparent'
              }`}
            >
              <ShieldAlert
                className={`mr-4 flex-shrink-0 h-5 w-5 transition-colors ${
                  pathname.startsWith('/admin') ? 'text-red-400' : 'text-zinc-500 group-hover:text-red-400'
                }`}
                aria-hidden="true"
              />
              Platform Admin
            </Link>
          )}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex flex-col px-4 py-4 space-y-2 border-t border-[#2A2A2A]">
        <Link
          href="/settings"
          className="group flex items-center px-4 py-3 text-sm font-semibold rounded-xl text-zinc-400 hover:bg-[#161616] hover:text-zinc-100 border border-transparent hover:border-[#3A3A3A] transition-all"
        >
          <Settings className="mr-4 flex-shrink-0 h-5 w-5 text-zinc-500 group-hover:text-zinc-100 transition-colors" />
          Settings
        </Link>
        <button
          onClick={() => clearAuth()}
          className="w-full group flex items-center px-4 py-3 text-sm font-semibold rounded-xl text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut className="mr-4 flex-shrink-0 h-5 w-5 text-zinc-500 group-hover:text-rose-400 transition-colors" />
          Sign out
        </button>
      </div>
    </div>
  );
}
