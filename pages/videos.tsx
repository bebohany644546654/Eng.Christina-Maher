import React, { useState } from 'react';
import styles from '../styles/Videos.module.css';
import YouTubePlayer from '../components/YouTubePlayer';

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  grade: string;
}

const VideosPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [newVideo, setNewVideo] = useState({
    title: '',
    videoUrl: '',
    grade: ''
  });
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractYouTubeId(newVideo.videoUrl);
    if (!videoId) return;
    
    setVideos([...videos, { ...newVideo, id: videoId }]);
    setNewVideo({ title: '', videoUrl: '', grade: '' });
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div className={styles.container}>
      <form className={styles.addVideoForm} onSubmit={handleAddVideo}>
        <h2>إضافة فيديو جديد</h2>
        <input
          type="text"
          placeholder="عنوان الفيديو"
          value={newVideo.title}
          onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="رابط الفيديو"
          value={newVideo.videoUrl}
          onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
        />
        <select
          value={newVideo.grade}
          onChange={(e) => setNewVideo({ ...newVideo, grade: e.target.value })}
        >
          <option value="">اختر الصف</option>
          <option value="first">الصف الأول الثانوي</option>
          <option value="second">الصف الثاني الثانوي</option>
          <option value="third">الصف الثالث الثانوي</option>
        </select>
        <button type="submit">إضافة الفيديو</button>
      </form>

      <div className={styles.videosList}>
        {videos.map((video) => (
          <div key={video.id} className={styles.videoCard}>
            <h3>{video.title}</h3>
            <p>الصف: {video.grade}</p>
            <div className={styles.videoActions}>
              <button onClick={() => setSelectedVideo(video)}>مشاهدة</button>
              <button onClick={() => {/* handle edit */}}>تعديل</button>
              <button onClick={() => {/* handle delete */}}>حذف</button>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div className={styles.videoModal}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={() => setSelectedVideo(null)}>×</button>
            <YouTubePlayer videoId={selectedVideo.id} title={selectedVideo.title} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideosPage;
