import React, { useState, useEffect, useCallback } from "react"; // Import React and useCallback
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Video } from "@/types"; // Correct import path for Video type
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, Search, Upload, Filter, Pencil, Trash2, Play } from "lucide-react";
import { SecureYouTubePlayer } from "@/components/SecureYouTubePlayer";
import { useToast } from "@/hooks/use-toast";

const VideosPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addVideo, getAllVideos, deleteVideo, updateVideo } = useData();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'first' | 'second' | 'third'>('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // نموذج إضافة فيديو جديد
  const [newVideo, setNewVideo] = useState({
    title: '',
    videoId: '',
    grade: 'first' as 'first' | 'second' | 'third'
  });

  // تحديث قائمة الفيديوهات عند التحميل وعند إضافة فيديو جديد
  useEffect(() => {
    const loadVideos = () => {
      const videos = getAllVideos();
      setVideos(videos);
    };
    
    loadVideos();
    // إعادة تحميل الفيديوهات كل 5 ثواني للتحديث المباشر
    const interval = setInterval(loadVideos, 5000);
    
    return () => clearInterval(interval);
  }, [getAllVideos]);

  // تصفية الفيديوهات حسب البحث والصف
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || video.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVideo.title.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال عنوان للفيديو"
      });
      return;
    }

    try {
      if (!newVideo.videoId.trim()) {
        throw new Error("يرجى إدخال رابط الفيديو");
      }

      const url = new URL(newVideo.videoId);
      let videoId: string | null = null;

      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1);
      } else if (url.hostname.includes('youtube.com')) {
        if (url.pathname.includes('/embed/')) {
          videoId = url.pathname.split('/embed/')[1];
        } else if (url.pathname.includes('/shorts/')) {
          videoId = url.pathname.split('/shorts/')[1];
        } else if (url.pathname.includes('/v/')) {
          videoId = url.pathname.split('/v/')[1];
        } else {
  return (
    <div style={{ padding: '20px' }}>
      <h1>صفحة الفيديوهات</h1>
      <p>المحتوى قيد الإنشاء...</p>
    </div> );
};

export default VideosPage;
