import React from 'react';

interface VimeoEmbedProps {
  vimeoId: string;
  title?: string;
}

export function VimeoEmbed({ vimeoId, title }: VimeoEmbedProps) {
  return (
    <div className="aspect-video w-full">
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}`}
        className="w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        title={title || `Vimeo video ${vimeoId}`}
      />
    </div>
  );  
}

interface YouTubeEmbedProps {
  youtubeId: string;
  title?: string;
}

export function YouTubeEmbed({ youtubeId, title }: YouTubeEmbedProps) {
  return (
    <div className="aspect-video w-full">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title || `YouTube video ${youtubeId}`}
      />
    </div>
  );
} 