import Link from "next/link";
import { Camera, Users, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 flex flex-col page-transition overflow-hidden relative">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Navbar */}
      <nav className="glass-nav py-4 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Camera className="w-6 h-6 text-violet-500" />
          <span className="text-lg font-bold tracking-tight">Memoria</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/explore" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
            Explore
          </Link>
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="primary-btn px-4 py-2 text-xs">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center z-10 py-24">
        <div className="inline-flex items-center space-x-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-medium text-zinc-300">The premier photo hub for college clubs</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-500 mb-6 max-w-4xl leading-tight">
          Capture the moment. <br/>
          <span className="text-violet-400">Share the memory.</span>
        </h1>
        
        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed font-body">
          Memoria is the dedicated platform for university clubs to organize, share, and manage event photos. Discover clubs, view stunning galleries, and relive the best moments of your college experience.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/register" className="primary-btn text-base px-8 py-3.5 flex items-center justify-center">
            Join Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link href="/explore" className="secondary-btn text-base px-8 py-3.5 flex items-center justify-center">
            Explore Clubs
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-32 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto w-full text-left">
          <div className="base-card p-6">
            <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">High-Res Galleries</h3>
            <p className="text-sm text-zinc-400 font-body">Immersive masonry grids designed to showcase your club's photography in its best light.</p>
          </div>
          <div className="base-card p-6">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Club Management</h3>
            <p className="text-sm text-zinc-400 font-body">Dedicated tools for admins to manage members, control access, and view engagement analytics.</p>
          </div>
          <div className="base-card p-6">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Social Experience</h3>
            <p className="text-sm text-zinc-400 font-body">Like your favorite shots, curate your personal collection, and never miss an update from your clubs.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800/60 py-8 text-center text-zinc-500 text-sm">
        <p>© {new Date().getFullYear()} Memoria. All rights reserved.</p>
      </footer>
    </div>
  );
}
