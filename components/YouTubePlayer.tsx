import React, { useState } from 'react';
import styles from '../styles/YouTubePlayer.module.css';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  title,
  onEdit,
  onDelete,
  isAdmin = false 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // تنظيف معرف الفيديو من أي بارامترات إضافية
  const cleanVideoId = videoId?.split('?')[0]?.split('&')[0]?.split('#')[0] || '';

  if (!cleanVideoId) {
    return (
      <div className={styles.errorMessage}>
        لا يوجد فيديو متاح للعرض
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${cleanVideoId}?rel=0&showinfo=1&controls=1&modestbranding=1&origin=${window.location.origin}&enablejsapi=1`;

  return (
    <div className={styles.videoWrapper}>
      {title && <h3 className={styles.videoTitle}>{title}</h3>}
      <div className={styles.videoContainer}>
        {isLoading && <div className={styles.loader}>جاري التحميل...</div>}
        <iframe
          width="100%"
          height="480"
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('عذراً، هذا الفيديو غير متاح حالياً');
            setIsLoading(false);
          }}
        />
      </div>
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <a 
            href={`https://www.youtube.com/watch?v=${cleanVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.youtubeLink}
          >
            مشاهدة على يوتيوب
          </a>
        </div>
      )}
      {isAdmin && (
        <div className={styles.controls}>
          <button 
            className={`${styles.controlButton} ${styles.editButton}`}
            onClick={onEdit}
          >
            تعديل
          </button>
          <button 
            className={`${styles.controlButton} ${styles.deleteButton}`}
            onClick={onDelete}
          >
            حذف
          </button>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
