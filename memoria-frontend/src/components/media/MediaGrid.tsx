'use client';

import Masonry from 'react-masonry-css';
import { MediaCard } from './MediaCard';

interface MediaItem {
  id: string;
  url: string;
  aspectRatio: number;
  likes?: number;
  file_type?: string;
}

interface MediaGridProps {
  items: MediaItem[];
}

const breakpointColumnsObj = {
  default: 4,
  1536: 4, // 2xl
  1280: 3, // xl
  1024: 3, // lg
  768: 2,  // md
  640: 1   // sm
};

export function MediaGrid({ items }: MediaGridProps) {
  if (!items?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>No photos available in this album.</p>
      </div>
    );
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-6"
      columnClassName="pl-6 bg-clip-padding"
    >
      {items.map((item) => (
        <MediaCard
          key={item.id}
          id={item.id}
          url={item.url}
          aspectRatio={item.aspectRatio}
          likes={item.likes}
          file_type={item.file_type}
        />
      ))}
    </Masonry>
  );
}
