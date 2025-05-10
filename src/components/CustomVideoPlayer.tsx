import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink } from "lucide-react";

interface CustomVideoPlayerProps {
  videoId: string;
  title: string;
  onError?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function CustomVideoPlayer({ videoId, title, onError }: CustomVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<number>();
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  useEffect(() => {
    if (!videoId) {
      setError("عذراً، لم يتم تحديد مصدر الفيديو");
      return;
    }

    const loadYouTubeAPI = async () => {
      return new Promise<void>((resolve, reject) => {
        if (!document.getElementById('youtube-api')) {
          const tag = document.createElement('script');
          tag.id = 'youtube-api';
          tag.src = "https://www.youtube.com/iframe_api";
          tag.onload = () => resolve();
          tag.onerror = () => reject(new Error("فشل تحميل YouTube API"));
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        } else {
          resolve();
        }
      });
    };

    const initializePlayer = async () => {
      try {
        await loadYouTubeAPI();
        
        if (!window.YT) {
          throw new Error("لم يتم تحميل YouTube API بشكل صحيح");
        }

        playerRef.current = new window.YT.Player('player', {
          videoId,
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            origin: window.location.origin,
            enablejsapi: 1,
            fs: 1,
            hl: 'ar',
            cc_lang_pref: 'ar',
            widget_referrer: window.location.origin,
            mute: 0
          },
          events: {
            onReady: (event: any) => {
              setIsReady(true);
              setError(null);
              event.target.setVolume(volume * 100);
              // حفظ حالة التشغيل في localStorage
              const savedState = localStorage.getItem(`video-state-${videoId}`);
              if (savedState) {
                const { currentTime } = JSON.parse(savedState);
                event.target.seekTo(currentTime);
              }
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
              // حفظ الموضع الحالي كل 5 ثواني
              if (event.data === window.YT.PlayerState.PLAYING) {
                progressInterval.current = window.setInterval(() => {
                  const currentTime = playerRef.current.getCurrentTime();
                  localStorage.setItem(`video-state-${videoId}`, JSON.stringify({
                    currentTime,
                    timestamp: Date.now()
                  }));
                }, 5000);
              } else {
                if (progressInterval.current) {
                  window.clearInterval(progressInterval.current);
                }
              }
            },
            onError: (event: any) => {
              const errorCodes: { [key: number]: string } = {
                2: "معرف الفيديو غير صالح",
                5: "خطأ في HTML5 Player",
                100: "الفيديو غير موجود أو تم حذفه",
                101: "الفيديو غير مسموح بتشغيله في مشغل مضمن",
                150: "الفيديو غير مسموح بتشغيله في مشغل مضمن"
              };
              
              setError(`عذراً، ${errorCodes[event.data] || "حدث خطأ أثناء تحميل الفيديو"}`);
              setIsReady(false);
              onError?.();
            }
          }
        });
      } catch (err) {
        console.error("Player initialization error:", err);
        setError(err instanceof Error ? err.message : "حدث خطأ في تهيئة مشغل الفيديو");
      }
    };

    initializePlayer();

    return () => {
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, volume, onError]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume * 100);
      setIsMuted(newVolume === 0);
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume * 100);
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-physics-dark rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(true)}
    >
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="goldBtn mx-2"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : (
        <>
          <div id="player" className="w-full h-full" />
          
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="text-white hover:text-physics-gold transition-colors"
                    title={isPlaying ? "إيقاف" : "تشغيل"}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMuteToggle}
                      className="text-white hover:text-physics-gold transition-colors"
                      title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 accent-physics-gold"
                      title="مستوى الصوت"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleFullscreen}
                    className="text-white hover:text-physics-gold transition-colors"
                    title="ملء الشاشة"
                  >
                    <Maximize size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}