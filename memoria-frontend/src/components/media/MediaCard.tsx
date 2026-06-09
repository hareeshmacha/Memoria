'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Download, Share2, Maximize2 } from 'lucide-react';

interface MediaCardProps {
  id: string;
  url: string;
  alt?: string;
  aspectRatio?: number;
  likes?: number;
  isLiked?: boolean;
  file_type?: string;
}

export function MediaCard({ id, url, alt = 'Event media', aspectRatio = 1, likes = 0, isLiked = false, file_type = 'image' }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative group rounded-xl overflow-hidden bg-muted cursor-pointer mb-6"
      style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {file_type === 'video' ? (
        <div className="absolute inset-0 bg-zinc-900">
           <video src={url} className="w-full h-full object-cover opacity-70" muted />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/20">
               <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
             </div>
           </div>
        </div>
      ) : (
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={false}
        />
      )}

      {/* Overlay gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Hover Actions */}
      <div 
        className={`absolute inset-0 p-4 flex flex-col justify-between transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex justify-end space-x-2">
          <button className="p-2 bg-background/20 hover:bg-background/40 backdrop-blur-md rounded-full text-white transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 bg-background/20 hover:bg-background/40 backdrop-blur-md rounded-full text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex space-x-3">
            <button 
              onClick={handleLike}
              className="group/like flex items-center space-x-1.5 p-2 bg-background/20 hover:bg-background/40 backdrop-blur-md rounded-full text-white transition-all"
            >
              <Heart 
                className={`w-5 h-5 transition-transform ${liked ? 'fill-accent text-accent scale-110' : 'group-hover/like:scale-110'}`} 
              />
              <span className="text-sm font-medium pr-1">{likeCount > 0 ? likeCount : ''}</span>
            </button>
          </div>
          
          <button className="p-2 bg-background/20 hover:bg-background/40 backdrop-blur-md rounded-full text-white transition-colors">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
