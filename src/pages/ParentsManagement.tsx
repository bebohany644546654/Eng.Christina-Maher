import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowRight, UserPlus, Search, UserX, Edit, Phone, Copy } from "lucide-react";
import PhysicsBackground from "@/components/PhysicsBackground";
import { PhoneContact } from "@/components/PhoneContact";
import { getGradeDisplay } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Parent } from "@/types";

const ParentsManagement = () => {
  const { getAllParents, createParent, getAllStudents } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<"all" | "first" | "second" | "third">("all");
  const [lastCreatedParentPassword, setLastCreatedParentPassword] = useState<string | null>(null);
  const parents = getAllParents();
  const students = getAllStudents();

  // Form state
  const [phone, setPhone] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const getStudentGrade = (studentCode: string) => {
    const student = students.find(s => s.code === studentCode);
    return student?.grade || null;
  };

  const filteredParents = parents.filter(parent => {
    // Apply grade filter first
    if (selectedGradeFilter !== "all") {
      const studentGrade = getStudentGrade(parent.studentCode);
      if (studentGrade !== selectedGradeFilter) {
        return false;
      }
    }
    
    // Then apply search filter
    return parent.phone.includes(searchQuery) || 
           parent.studentName.includes(searchQuery) ||
           parent.studentCode.includes(searchQuery);
  });

  const handleAddParent = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newParent = createParent(phone, studentCode);
      setLastCreatedParentPassword(newParent.password);
      setPhone("");
      setStudentCode("");
    } catch (error) {
      console.error("Failed to create parent:", error);
    }
  };

  const handleEditParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;

    const updatedParent = {
      ...editingParent,
      phone,
      studentCode,
    };

    const parentIndex = parents.findIndex(p => p.id === editingParent.id);
    if (parentIndex !== -1) {
      const newParents = [...parents];
      newParents[parentIndex] = updatedParent;
      localStorage.setItem("parents", JSON.stringify(newParents));
      window.location.reload();
    }

    setShowEditForm(false);
    setEditingParent(null);
    toast({
      title: "تم تحديث البيانات",
      description: "تم تحديث بيانات ولي الأمر بنجاح"
    });
  };

  const handleDeleteParent = (parentId: string, parentName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف حساب ولي الأمر؟`)) {
      const newParents = parents.filter(p => p.id !== parentId);
      localStorage.setItem("parents", JSON.stringify(newParents));
      navigate("/dashboard");
      toast({
        title: "تم حذف الحساب",
        description: "تم حذف حساب ولي الأمر بنجاح",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      toast({
        title: "تم النسخ",
        description: "تم نسخ كلمة المرور بنجاح",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        variant: "destructive",
        title: "خطأ في النسخ",
        description: "حدث خطأ أثناء نسخ كلمة المرور",
      });
    }
  };

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col">
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-physics-gold">إدارة أولياء الأمور</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-white/80">عدد أولياء الأمور: {filteredParents.length}</p>
                <div className="w-px h-4 bg-white/20" />
                <p className="text-white/80">
                  {selectedGradeFilter === "all" 
                    ? "جميع الصفوف" 
                    : selectedGradeFilter === "first" 
                      ? "الصف الأول الثانوي"
                      : selectedGradeFilter === "second"
                        ? "الصف الثاني الثانوي"
                        : "الصف الثالث الثانوي"
                  }
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="goldBtn flex items-center gap-2"
            >
              <UserPlus size={18} />
              <span>إضافة ولي أمر</span>
            </button>
          </div>
          
          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <select
                className="inputField"
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value as "all" | "first" | "second" | "third")}
              >
                <option value="all">جميع الصفوف</option>
                <option value="first">الصف الأول الثانوي</option>
                <option value="second">الصف الثاني الثانوي</option>
                <option value="third">الصف الثالث الثانوي</option>
              </select>
            </div>
            
            <div className="relative w-full md:w-2/3">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-physics-gold" size={20} />
              <input
                type="text"
                className="inputField pr-12"
                placeholder="ابحث عن ولي أمر بالرقم أو اسم الطالب"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Parents List */}
          <div className="bg-physics-dark/80 rounded-lg overflow-hidden">
            {filteredParents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white text-lg">لا يوجد أولياء أمور مسجلين</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-physics-navy text-physics-gold">
                      <th className="text-right py-4 px-4">معلومات الطالب</th>
                      <th className="text-right py-4 px-4">معلومات ولي الأمر</th>
                      <th className="text-right py-4 px-4">معلومات الفصل</th>
                      <th className="text-right py-4 px-4">بيانات الحساب</th>
                      <th className="text-center py-4 px-4">خيارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-physics-navy/30">
                    {filteredParents.map((parent) => {
                      const studentGrade = getStudentGrade(parent.studentCode);
                      return (
                        <tr key={parent.id} className="hover:bg-physics-navy/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <p className="text-xl text-white font-bold">{parent.studentName}</p>
                              <p className="text-sm text-physics-gold">الكود: <span className="font-mono">{parent.studentCode}</span></p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1 text-[0.95rem]">
                              <div className="flex items-center gap-2">
                                <span className="text-physics-gold">رقم الهاتف:</span>
                                <span className="text-white font-mono">{parent.phone}</span>
                                <a
                                  href={`tel:${parent.phone}`}
                                  className="p-1 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                                  title="اتصال"
                                >
                                  <Phone size={16} />
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1 text-[0.95rem]">
                              <div className="flex items-center gap-2">
                                <span className="text-physics-gold">الصف:</span>
                                <span className="text-white">{studentGrade ? getGradeDisplay(studentGrade) : "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1 text-[0.95rem]">
                              <div className="flex items-center gap-2">
                                <span className="text-physics-gold">كلمة المرور:</span>
                                <span className="text-white font-mono">{parent.password}</span>
                                <button
                                  onClick={() => copyToClipboard(parent.password)}
                                  className="p-1 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                                  title="نسخ كلمة المرور"
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingParent(parent);
                                  setPhone(parent.phone);
                                  setStudentCode(parent.studentCode);
                                  setShowEditForm(true);
                                }}
                                className="p-2 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                                title="تعديل"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteParent(parent.id, parent.studentName)}
                                className="p-2 text-red-400 hover:text-red-500 rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                                title="حذف"
                              >
                                <UserX size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Parent Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-physics-dark rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-physics-gold mb-6">إضافة ولي أمر جديد</h2>
            
            {lastCreatedParentPassword ? (
              <div className="mb-6 p-4 bg-physics-navy/30 rounded-lg">
                <p className="text-white mb-2">تم إنشاء الحساب بنجاح!</p>
                <div className="flex items-center gap-2">
                  <span className="text-physics-gold">كلمة المرور:</span>
                  <span className="text-white font-mono text-lg">{lastCreatedParentPassword}</span>
                </div>
                <p className="text-white/70 text-sm mt-2">يرجى حفظ كلمة المرور في مكان آمن</p>
                <div className="flex gap-4 mt-4">
                  <button 
                    className="goldBtn flex-1"
                    onClick={() => {
                      setShowAddForm(false);
                      setLastCreatedParentPassword(null);
                    }}
                  >
                    إغلاق
                  </button>
                  <button 
                    className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
                    onClick={() => setLastCreatedParentPassword(null)}
                  >
                    إضافة ولي أمر آخر
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddParent} className="space-y-4">
                <div>
                  <label className="block text-white mb-1">رقم هاتف ولي الأمر</label>
                  <input
                    type="text"
                    className="inputField"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-1">كود الطالب</label>
                  <input
                    type="text"
                    className="inputField"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="goldBtn flex-1">
                    إضافة ولي الأمر
                  </button>
                  <button 
                    type="button" 
                    className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
                    onClick={() => {
                      setShowAddForm(false);
                      setLastCreatedParentPassword(null);
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Edit Parent Modal */}
      {showEditForm && editingParent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-physics-dark rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-physics-gold mb-6">تعديل بيانات ولي الأمر</h2>
            
            <form onSubmit={handleEditParent} className="space-y-4">
              <div>
                <label className="block text-white mb-1">رقم هاتف ولي الأمر</label>
                <input
                  type="text"
                  className="inputField"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-white mb-1">كود الطالب</label>
                <input
                  type="text"
                  className="inputField"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="goldBtn flex-1">
                  حفظ التغييرات
                </button>
                <button 
                  type="button" 
                  className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingParent(null);
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsManagement;
