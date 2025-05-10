import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { ArrowRight, AlertTriangle, Trash2 } from "lucide-react";
import PhysicsBackground from "@/components/PhysicsBackground";
import { PhoneContact } from "@/components/PhoneContact";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

const SystemReset = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [resetMode, setResetMode] = useState<"first" | "second" | "all" | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const handleReset = () => {
    if (!isConfirming || !resetMode) {
      setIsConfirming(true);
      return;
    }

    // تعديل المقارنة لتكون أكثر مرونة مع النص العربي
    const normalizedConfirmText = confirmText.trim().replace(/[\u064B-\u0652]/g, ''); // إزالة علامات التشكيل
    if (normalizedConfirmText !== 'تاكيد' && normalizedConfirmText !== 'تأكيد') {
      toast({
        title: "خطأ في التأكيد",
        description: 'الرجاء كتابة كلمة "تأكيد" للمتابعة',
        variant: "destructive"
      });
      return;
    }

    try {
      if (resetMode === "all") {
        // حذف جميع البيانات المخزنة في localStorage
        const keysToReset = [
          'students',
          'parents',
          'grades',
          'attendance',
          'payments',
          'videos',
          'books',
          'currentUser',
          'userLoggedIn'
        ];
        keysToReset.forEach(key => localStorage.removeItem(key));
        
        toast({
          title: "تم إعادة تعيين النظام",
          description: "تم حذف جميع البيانات بنجاح",
          variant: "destructive"
        });

        // تسجيل الخروج وتوجيه المستخدم لصفحة تسجيل الدخول
        logout();
        navigate("/login");
      } else {
        // حذف بيانات صف محدد
        const gradeLevel = resetMode === "first" ? "first" : "second";
        
        // حذف الطلاب وأولياء الأمور للصف المحدد
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const filteredStudents = students.filter((s: any) => s.grade !== gradeLevel);
        localStorage.setItem('students', JSON.stringify(filteredStudents));

        // حذف درجات الطلاب للصف المحدد
        const grades = JSON.parse(localStorage.getItem('grades') || '[]');
        const studentIds = students.filter((s: any) => s.grade === gradeLevel).map((s: any) => s.id);
        const filteredGrades = grades.filter((g: any) => !studentIds.includes(g.studentId));
        localStorage.setItem('grades', JSON.stringify(filteredGrades));

        // حذف سجلات الحضور للصف المحدد
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const filteredAttendance = attendance.filter((a: any) => !studentIds.includes(a.studentId));
        localStorage.setItem('attendance', JSON.stringify(filteredAttendance));

        // حذف المدفوعات للصف المحدد
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        const filteredPayments = payments.filter((p: any) => p.grade !== gradeLevel);
        localStorage.setItem('payments', JSON.stringify(filteredPayments));

        // حذف الفيديوهات والكتب للصف المحدد
        const videos = JSON.parse(localStorage.getItem('videos') || '[]');
        const filteredVideos = videos.filter((v: any) => v.grade !== gradeLevel);
        localStorage.setItem('videos', JSON.stringify(filteredVideos));

        const books = JSON.parse(localStorage.getItem('books') || '[]');
        const filteredBooks = books.filter((b: any) => b.grade !== gradeLevel);
        localStorage.setItem('books', JSON.stringify(filteredBooks));

        toast({
          title: "تم حذف البيانات",
          description: `تم حذف جميع بيانات ${gradeLevel === "first" ? "الصف الأول الثانوي" : "الصف الثاني الثانوي"} بنجاح`,
          variant: "destructive"
        });

        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload();
      }
    } catch (error) {
      console.error('Error during reset:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف البيانات",
        variant: "destructive"
      });
    }

    setIsConfirming(false);
    setResetMode(null);
    setConfirmText("");
  };

  const getResetDescription = () => {
    switch (resetMode) {
      case "first":
        return "حذف جميع بيانات الصف الأول الثانوي";
      case "second":
        return "حذف جميع بيانات الصف الثاني الثانوي";
      case "all":
        return "حذف جميع بيانات النظام";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
      <PhysicsBackground />
      <PhoneContact />
      
      {/* Header */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-physics-gold hover:opacity-80"
          >
            <ArrowRight size={20} />
            <span>العودة للرئيسية</span>
          </button>
        </div>
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-physics-gold mb-6">إعادة تعيين النظام</h1>
          
          <div className="grid gap-6 mb-6">
            <button
              onClick={() => {
                setResetMode("first");
                setIsConfirming(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                <span>حذف بيانات الصف الأول الثانوي</span>
              </div>
            </button>

            <button
              onClick={() => {
                setResetMode("second");
                setIsConfirming(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="flex itemscenter gap-3">
                <Trash2 className="w-5 h-5" />
                <span>حذف بيانات الصف الثاني الثانوي</span>
              </div>
            </button>

            <button
              onClick={() => {
                setResetMode("all");
                setIsConfirming(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                <span>حذف جميع بيانات النظام</span>
              </div>
            </button>
          </div>

          {resetMode && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>تحذير!</AlertTitle>
              <AlertDescription>
                <p>سيؤدي {getResetDescription()} بما في ذلك:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {resetMode === "all" ? (
                    <>
                      <li>جميع بيانات الطلاب وأولياء الأمور</li>
                      <li>جميع سجلات الحضور والغياب</li>
                      <li>جميع سجلات الدرجات</li>
                      <li>جميع المدفوعات</li>
                      <li>جميع الفيديوهات والكتب المضافة</li>
                    </>
                  ) : (
                    <>
                      <li>بيانات الطلاب وأولياء الأمور للصف المحدد</li>
                      <li>سجلات الحضور والغياب للصف المحدد</li>
                      <li>سجلات الدرجات للصف المحدد</li>
                      <li>المدفوعات للصف المحدد</li>
                      <li>الفيديوهات والكتب المضافة للصف المحدد</li>
                    </>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {isConfirming && resetMode ? (
            <div className="space-y-4">
              <p className="text-white">هل أنت متأكد من {getResetDescription()}؟ لا يمكن التراجع عن هذا الإجراء.</p>
              
              <div className="bg-physics-dark/50 p-4 rounded-lg">
                <label className="block text-white mb-2">
                  اكتب كلمة "تأكيد" للمتابعة:
                </label>
                <input
                  type="text"
                  className="w-full bg-physics-navy border border-physics-gold/20 rounded-lg px-4 py-2 text-white"
                  placeholder='اكتب "تأكيد"'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  dir="rtl"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={confirmText.trim().replace(/[\u064B-\u0652]/g, '') !== 'تاكيد' && confirmText.trim().replace(/[\u064B-\u0652]/g, '') !== 'تأكيد'}
                >
                  تأكيد الحذف
                </button>
                <button
                  onClick={() => {
                    setIsConfirming(false);
                    setResetMode(null);
                    setConfirmText("");
                  }}
                  className="bg-physics-dark text-white py-2 px-4 rounded-lg hover:bg-physics-navy transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default SystemReset;