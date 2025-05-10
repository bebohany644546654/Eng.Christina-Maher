import React, { useEffect, useRef, useState } from 'react';

interface SecureYouTubePlayerProps {
  videoId: string | null;
  title?: string;
  className?: string;
  onError?: (error: string) => void;
  onVideoEnd?: () => void;
  autoPlay?: boolean;
}

const YOUTUBE_API_SCRIPT_ID = 'youtube-iframe-api';

export function SecureYouTubePlayer({ 
  videoId,
  title,
  className,
  onError,
  onVideoEnd,
  autoPlay = false,
}: SecureYouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(Boolean(window.YT && window.YT.Player));

  // تنظيف معرف الفيديو
  const cleanVideoId = videoId?.split('?')[0]?.split('&')[0]?.split('#')[0] || '';

  // تحميل YouTube IFrame API script
  useEffect(() => {
    if (isApiReady) return;

    const existingScript = document.getElementById(YOUTUBE_API_SCRIPT_ID);
    if (existingScript) {
      // If script exists but API is not ready, maybe it's still loading?
      // We set the callback again in case it was missed.
      if (!window.YT) {
        window.onYouTubeIframeAPIReady = () => {
          console.log("YouTube API Ready (existing script)");
          setIsApiReady(true);
        };
      } else {
        setIsApiReady(true);
      }
      return;
    }

    const tag = document.createElement('script');
    tag.id = YOUTUBE_API_SCRIPT_ID;
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API Ready (new script)");
      setIsApiReady(true);
    };

    // Cleanup function to remove the script if component unmounts before API is ready
    // Although generally API script is loaded once per page.
    return () => {
        // Potentially remove the script if it wasn't needed anymore, but usually it's kept.
        // const scriptTag = document.getElementById(YOUTUBE_API_SCRIPT_ID);
        // if (scriptTag) document.body.removeChild(scriptTag);
        // window.onYouTubeIframeAPIReady = undefined; // Clean up callback
    };
  }, [isApiReady]);

  // تهيئة المشغل عند جهوزية الـ API وتغير الفيديو
  useEffect(() => {
    if (!isApiReady || !cleanVideoId || !playerContainerRef.current) {
        // Wait for API, videoId and container div
        return;
    }

    // Destroy existing player instance if videoId changes
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    setIsLoading(true); // Show loader when initializing new video
    setError(null);

    try {
        const player = new window.YT.Player(playerContainerRef.current, {
            videoId: cleanVideoId,
            playerVars: {
              autoplay: autoPlay ? 1 : 0,
              controls: 1, // Show default YouTube controlsالتحكم الافتراضية
              rel: 0, // عدم عرض الفيديوهات ذات الصلة
              showinfo: 0, // عدم عرض عنوان الفيديو ومعلومات القناة
              modestbranding: 1, // تقليل شعار يوتيوب
              iv_load_policy: 3, // إخفاء التعليقات التوضيحية
              fs: 0, // تعطيل زر ملء الشاشة الافتراضي (سنتحكم به بأنفسنا)
              hl: 'ar', // لغة الواجهة (إذا ظهرت أي رسائل)
              origin: window.location.origin, // للأمان
              enablejsapi: 1 // تمكين التحكم عبر JS
            },
            events: {
              onReady: (event) => {
                console.log("Player Ready");
                setIsLoading(false);
                playerRef.current = event.target;
                // Optionally mute or set volume here
                // event.target.mute(); 
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.ENDED) {
                  console.log("Video Ended");
                  onVideoEnd?.();
                }
                // Handle other states if needed (PLAYING, PAUSED, BUFFERING)
              },
              onError: (event) => {
                console.error("YouTube Player Error:", event.data);
                let errorMessage = `خطأ في مشغل يوتيوب (${event.data})`;
                switch (event.data) {
                    case 2: errorMessage = "طلب غير صالح (قد يكون معرف الفيديو غير صحيح)"; break;
                    case 5: errorMessage = "خطأ متعلق بمشغل HTML5"; break;
                    case 100: errorMessage = "الفيديو غير موجود أو خاص"; break;
                    case 101: case 150: errorMessage = "مالك الفيديو لا يسمح بتضمينه"; break;
                }
                setError(errorMessage);
                onError?.(errorMessage);
                setIsLoading(false);
              }
            }
        });
    } catch (e) {
        console.error("Failed to create YouTube player:", e);
        const errorMsg = "فشل في تهيئة مشغل يوتيوب.";
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
    }

    // Cleanup function to destroy player on component unmount or video change
    return () => {
      if (playerRef.current) {
        console.log("Destroying player instance");
        // Check if destroy method exists before calling, belt-and-suspenders
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            try {
                playerRef.current.destroy();
            } catch (cleanupError) {
                console.error("Error destroying YouTube player:", cleanupError);
            }
        }
        playerRef.current = null;
      }
    };
  // Dependencies: API readiness and the cleaned video ID
  }, [isApiReady, cleanVideoId, autoPlay, onError, onVideoEnd]);

  // --- Custom Controls Handlers (Placeholder) ---  // ---------------------------------------------

  return (
    <div className={`relative w-full aspect-video bg-physics-dark ${className || ''}`}>
      {/* Player Container - Relative positioning needed for overlay */}
      <div ref={playerContainerRef} id="youtube-player-container" className="absolute inset-0 w-full h-full"></div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-physics-dark/80 z-20">
          <div className="w-12 h-12 border-4 border-physics-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 text-white p-4 z-20">
          <p>{error}</p>
        </div>
      )}

    </div>
  );
}