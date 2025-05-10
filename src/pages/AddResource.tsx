import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, Upload, File, Link } from "lucide-react";

const AddResource = () => {
  const navigate = useNavigate();
  const { saveResource } = useData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [grade, setGrade] = useState<"first" | "second" | "third">("first");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "url">("file");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من حجم الملف (50MB كحد أقصى)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "حجم الملف كبير جداً",
          description: "الحد الأقصى لحجم الملف هو 50 ميجابايت"
        });
        return;
      }

      setSelectedFile(file);
      // تعيين العنوان تلقائياً من اسم الملف إذا كان فارغاً
      if (!title) {
        setTitle(file.name.split('.')[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!title.trim()) {
        throw new Error("الرجاء إدخال عنوان للملف");
      }

      if (uploadType === "file" && !selectedFile) {
        throw new Error("الرجاء اختيار ملف للرفع");
      }

      if (uploadType === "url" && !url.trim()) {
        throw new Error("الرجاء إدخال رابط صحيح للملف");
      }

      // التحقق من صحة الرابط إذا تم اختيار نوع URL
      if (uploadType === "url" && !url.match(/^https?:\\/\\/.+/)) {
        throw new Error("الرجاء إدخال رابط صحيح يبدأ بـ http:// أو https://");
      }

      await saveResource(
        title.trim(),
        "", // لا نحتاج وصف
        uploadType === "file" ? selectedFile : null,
        uploadType === "url" ? url.trim() : null,
        grade,
        "book"
      );

      // إعادة تعيين النموذج
      setTitle("");
      setSelectedFile(null);
      setUrl("");
      setGrade("first");
      
      // العودة لصفحة الكتب
      navigate("/books");

      toast({
        title: "تم بنجاح",
        description: "تم رفع الملف بنجاح"
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في الرفع",
        description: error?.message || "حدث خطأ أثناء رفع الملف. حاول مرة أخرى"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
      <PhoneContact />
      
      {/* Header */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/books")}
            className="flex items-center gap-2 text-physics-gold hover:opacity-80"
          >
            <ArrowRight size={20} />
            <span>العودة للكتب والملفات</span>
          </button>
        </div>
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-physics-gold mb-6">إضافة كتاب/ملف جديد</h1>
          
          <div className="bg-physics-dark rounded-lg p-6 mb-6">
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setUploadType("file")}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                  uploadType === "file"
                    ? "bg-physics-gold text-physics-dark"
                    : "bg-physics-navy/50 text-white hover:bg-physics-navy"
                }`}
              >
                <File size={20} />
                <span>رفع ملف</span>
              </button>
              
              <button
                type="button"
                onClick={() => setUploadType("url")}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                  uploadType === "url"
                    ? "bg-physics-gold text-physics-dark"
                    : "bg-physics-navy/50 text-white hover:bg-physics-navy"
                }`}
              >
                <Link size={20} />
                <span>إضافة رابط</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white mb-1">عنوان الكتاب/الملف</label>
                <input
                  type="text"
                  className="inputField"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="أدخل عنوان الملف..."
                  required
                />
              </div>

              {uploadType === "file" ? (
                <div>
                  <label className="block text-white mb-1">اختر الملف</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-physics-gold/30 rounded-lg p-8 text-center hover:border-physics-gold transition-colors"
                  >
                    {selectedFile ? (
                      <div className="text-white">
                        <File size={32} className="mx-auto mb-2 text-physics-gold" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <Upload size={32} className="mx-auto mb-2" />
                        <p>اضغط لاختيار ملف أو اسحب الملف هنا</p>
                        <p className="text-sm mt-1">PDF, Word, PowerPoint, Excel</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-white mb-1">رابط الملف</label>
                  <input
                    type="url"
                    className="inputField"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    يجب أن يكون الرابط مباشر للملف
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-white mb-1">الصف الدراسي</label>
                <select
                  className="inputField"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as "first" | "second" | "third")}
                  required
                >
                  <option value="first">الصف الأول الثانوي</option>
                  <option value="second">الصف الثاني الثانوي</option>
                  <option value="third">الصف الثالث الثانوي</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="goldBtn w-full flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <Upload size={20} />
                <span>{isLoading ? "جاري الرفع..." : "رفع الملف"}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddResource;
