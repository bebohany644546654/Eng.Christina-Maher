import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { toast } from "@/hooks/use-toast";

interface VideoUploaderProps {
  onSubmit: (video: any) => void;
  initialData?: any;
  onClose?: () => void;
}

export function VideoUploader({ onSubmit, initialData, onClose }: VideoUploaderProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [grade, setGrade] = useState<"first" | "second" | "third">("first");
  const { addVideo, updateVideo } = useData();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setUrl(initialData.url);
      setGrade(initialData.grade);
    }
  }, [initialData]);

  const validateYoutubeUrl = (url: string): string | null => {
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
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const processedUrl = validateYoutubeUrl(url);
    if (!processedUrl) {
      toast({
        title: "خطأ في الرابط",
        description: "يرجى إدخال رابط يوتيوب صحيح",
        variant: "destructive"
      });
      return;
    }

    try {
      const videoData = {
        id: initialData?.id || `video-${Date.now()}`,
        title,
        url: processedUrl,
        grade
      };

      if (initialData) {
        await updateVideo(initialData.id, title, processedUrl, grade);
        toast({
          title: "تم تحديث الفيديو",
          description: "تم تحديث الفيديو بنجاح",
        });
      } else {
        await addVideo(title, processedUrl, grade);
        toast({
          title: "تم إضافة الفيديو",
          description: "تم إضافة الفيديو بنجاح",
        });
      }

      setTitle("");
      setUrl("");
      setGrade("first");
      
      if (onClose) {
        onClose();
      }

      onSubmit(videoData);
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "حدث خطأ أثناء معالجة الفيديو",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-physics-gold font-semibold">عنوان الفيديو</label>
        <input
          type="text"
          className="inputField w-full rounded-lg border-2 border-physics-gold bg-physics-navy/50 text-white focus:ring-2 focus:ring-physics-gold/50"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="عنوان الفيديو"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-physics-gold font-semibold">رابط الفيديو</label>
        <input
          type="text"
          className="inputField w-full rounded-lg border-2 border-physics-gold bg-physics-navy/50 text-white focus:ring-2 focus:ring-physics-gold/50"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="رابط يوتيوب"
          dir="ltr"
        />
        <p className="text-sm text-gray-400">
          مثال: https://youtube.com/watch?v=xxxxx<br/>
          أو: https://youtu.be/xxxxx<br/>
          أو: https://youtube.com/shorts/xxxxx
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-physics-gold font-semibold">الصف الدراسي</label>
        <select
          className="inputField w-full rounded-lg border-2 border-physics-gold bg-physics-navy/50 text-white focus:ring-2 focus:ring-physics-gold/50"
          value={grade}
          onChange={(e) => setGrade(e.target.value as "first" | "second" | "third")}
          required
        >
          <option value="first">الصف الأول الثانوي</option>
          <option value="second">الصف الثاني الثانوي</option>
          <option value="third">الصف الثالث الثانوي</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 space-x-reverse pt-4">
        <button 
          type="button" 
          onClick={onClose}
          className="px-4 py-2 rounded-lg border-2 border-physics-gold text-physics-gold hover:bg-physics-gold/10 transition-colors"
        >
          إلغاء
        </button>
        <button 
          type="submit" 
          className="goldBtn px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          {initialData ? "تحديث الفيديو" : "إضافة الفيديو"}
        </button>
      </div>
    </form>
  );
}