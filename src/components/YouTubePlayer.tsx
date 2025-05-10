import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showControls?: boolean;
}

export function YouTubePlayer({ videoId, title, onEdit, onDelete, showControls = true }: YouTubePlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // تنظيف معرف الفيديو من أي بارامترات إضافية
  const cleanVideoId = videoId?.split('?')[0]?.split('&')[0]?.split('#')[0] || '';

  // بناء رابط التضمين مع الإعدادات المناسبة
  const embedUrl = `https://www.youtube.com/embed/${cleanVideoId}?autoplay=0&rel=0&showinfo=1&modestbranding=1&origin=${window.location.origin}&enablejsapi=1&widgetid=1`;

  const handleError = () => {
    setError('عذراً، هذا الفيديو غير متاح حالياً');
    setIsLoading(false);
  };

  useEffect(() => {
    // التحقق من صحة معرف الفيديو
    if (!cleanVideoId || !/^[a-zA-Z0-9_-]{11}$/.test(cleanVideoId)) {
      setError('عذراً، معرف الفيديو غير صالح');
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);
  }, [cleanVideoId]);

  return (
    <div className="bg-physics-dark rounded-lg overflow-hidden">
      <div className="p-4 border-b border-physics-gold/20">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          {showControls && (
            <div className="flex gap-2">
              {onEdit && (
                <button 
                  onClick={onEdit}
                  className="p-2 text-physics-gold hover:bg-physics-gold/10 rounded-full transition-colors"
                  title="تعديل الفيديو"
                >
                  <Pencil size={20} />
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={onDelete}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                  title="حذف الفيديو"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-physics-dark">
            <div className="w-12 h-12 border-4 border-physics-gold border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-physics-dark text-center p-4">
            <div>
              <p className="text-red-400 mb-2">{error}</p>
              <a 
                href={`https://www.youtube.com/watch?v=${cleanVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-physics-gold hover:underline"
              >
                مشاهدة على يوتيوب
              </a>
            </div>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}