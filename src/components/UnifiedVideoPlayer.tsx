import React from 'react';
import { VideoPlayerCore } from './VideoPlayerCore';
import { SecureYouTubePlayer } from './SecureYouTubePlayer';

interface UnifiedVideoPlayerProps {
  source: {
    url: string;
    type?: 'youtube' | 'direct';
  };
  title?: string;
  onError?: () => void;
  onVideoEnd?: () => void;
  autoPlay?: boolean;
}

function getYouTubeId(url: string): string | null {
  try {
    const videoUrl = new URL(url);
    let videoId: string | null = null;

    if (videoUrl.hostname === 'youtu.be') {
      videoId = videoUrl.pathname.slice(1);
    } else if (videoUrl.hostname.includes('youtube.com')) {
      if (videoUrl.pathname.includes('/embed/')) {
        videoId = videoUrl.pathname.split('/embed/')[1];
      } else if (videoUrl.pathname.includes('/shorts/')) {
        videoId = videoUrl.pathname.split('/shorts/')[1];
      } else if (videoUrl.pathname.includes('/v/')) {
        videoId = videoUrl.pathname.split('/v/')[1];
      } else {
        const searchParams = new URLSearchParams(videoUrl.search);
        videoId = searchParams.get('v');
      }
    }

    if (videoId) {
      videoId = videoId.split('?')[0].split('&')[0].split('#')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function UnifiedVideoPlayer({ source, title, onError, onVideoEnd, autoPlay }: UnifiedVideoPlayerProps) {
  // تحديد نوع الفيديو تلقائياً إذا لم يتم تحديده
  const videoType = source.type || (source.url.includes('youtube.com') || source.url.includes('youtu.be') ? 'youtube' : 'direct');
  
  if (videoType === 'youtube') {
    const videoId = getYouTubeId(source.url);
    if (!videoId) {
      return (
        <div className="w-full aspect-video bg-physics-dark rounded-lg flex items-center justify-center text-center p-4">
          <p className="text-red-400">عذراً، رابط الفيديو غير صالح</p>
        </div>
      );
    }

    return (
      <SecureYouTubePlayer 
        videoId={videoId} 
        title={title}
        onError={onError}
        onVideoEnd={onVideoEnd}
        autoPlay={autoPlay}
      />
    );
  }

  return (
    <VideoPlayerCore 
      src={source.url}
      title={title || ''}
      onError={onError}
      onVideoEnd={onVideoEnd}
      autoPlay={autoPlay}
    />
  );
}